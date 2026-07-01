import { transform } from "lightningcss";
import css2nest from "@3-/css2nest";
import read from "@1-/read";
import { dirname, resolve } from "node:path";
import stylus from "stylus";
import compile from "../src/compile.js";
import { expect, test } from "bun:test";
import { glob } from "glob";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

export const liftImports = (css) => {
    const imports = [],
      others = [],
      lines = css.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("@import")) {
        imports.push(line);
      } else {
        others.push(line);
      }
    }
    return [...imports, ...others].join("\n");
  },
  sortFlatCss = (css) => {
    const blocks = [];
    let current = "",
      depth = 0;
    for (let i = 0; i < css.length; ++i) {
      const char = css[i];
      current += char;
      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          blocks.push(current.trim());
          current = "";
        }
      } else if (char === ";" && depth === 0) {
        blocks.push(current.trim());
        current = "";
      }
    }
    if (current.trim()) {
      blocks.push(current.trim());
    }
    return blocks
      .map((b) => b.trim())
      .filter(Boolean)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .join("\n\n");
  },
  normalizeCSS = (css_str) => {
    const lifted = liftImports(css_str),
      { code } = transform({
        filename: "style.css",
        code: Buffer.from(lifted),
        minify: false, // Pretty print for readable diffs
      });
    return code
      .toString()
      .trim()
      .replace(/\s*\/\s*/g, "/");
  },
  normalizeNesting = (css) => {
    const lifted = liftImports(css),
      flat = transform({
        filename: "style.css",
        code: Buffer.from(lifted),
        minify: true,
        targets: { chrome: 90 << 16 },
      }).code.toString(),
      sorted_flat = sortFlatCss(flat);
    return normalizeCSS(css2nest(sorted_flat));
  },
  compare = async (file) => {
    const full_path = resolve(file),
      content = await read(full_path),
      [our_css] = await compile(full_path),
      stylus_css = await new Promise((res, rej) => {
        stylus.render(content, { filename: full_path, paths: [dirname(full_path)] }, (err, css) => {
          if (err) rej(err);
          else res(css);
        });
      });
    expect(normalizeNesting(our_css)).toBe(normalizeNesting(stylus_css));
  },
  compareOfficial = async (name, official_dir) => {
    const styl_path = resolve(official_dir, name + ".styl"),
      expected_css = await read(resolve(official_dir, name + ".css")),
      [css] = await compile(styl_path);
    expect(normalizeNesting(css)).toBe(normalizeNesting(expected_css));
  },
  testDir = async (dir_name, test_prefix) => {
    const dir_path = resolve(import.meta.dirname, dir_name),
      files = await glob(resolve(dir_path, "**/*.styl"));
    files.forEach((file) => {
      const rel_path = file.slice(import.meta.dirname.length + 1);
      test(test_prefix + " " + rel_path, () => compare(file));
    });
  };

let case_counter = 0;
export const runCases = (cases, base_dir) => {
  cases.forEach(
    ({ name, files, entry, compileArgs = [], includes = [], excludes = [], error, assert }) => {
      test(name, async () => {
        const case_dir = resolve(base_dir, `case_${case_counter++}`);

        for (const [rel_path, content] of Object.entries(files)) {
          const full_path = resolve(case_dir, rel_path),
            dir = dirname(full_path);
          if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
          }
          await writeFile(full_path, content);
        }

        const entry_path = resolve(case_dir, entry);

        try {
          if (error) {
            const [expected_err, expected_data] = error;
            try {
              await compile(entry_path, ...compileArgs);
              expect().fail("应抛出错误");
            } catch (e) {
              const [err, err_data] = e;
              expect(err).toBe(expected_err);
              if (expected_data) {
                expect(err_data).toBe(resolve(case_dir, expected_data));
              }
            }
          } else {
            const [css] = await compile(entry_path, ...compileArgs);
            includes.forEach((str) => expect(css).toContain(str));
            excludes.forEach((str) => expect(css).not.toContain(str));
            if (assert) {
              await assert(css);
            }
          }
        } finally {
          if (existsSync(case_dir)) {
            await rm(case_dir, { recursive: true, force: true });
          }
        }
      });
    },
  );
};
