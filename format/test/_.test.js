#!/usr/bin/env -S bun test

import read from "@3-/read";
import { test, expect } from "bun:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";
import lint from "../src/_.js";

test("lint 格式化输出", async () => {
  const js_file = join(import.meta.dirname, "t.js"),
    styl_file = join(import.meta.dirname, "t.styl"),
    svg_file = join(import.meta.dirname, "t.svg"),
    txt_file = join(import.meta.dirname, "t.txt"),
    rm = (fp) => {
      try {
        unlinkSync(fp);
      } catch {}
    },
    files = [
      [js_file, "const a = 1 ; \n const b = 2;"],
      [styl_file, "body\n  color red"],
      [
        svg_file,
        '<svg viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="red"/></svg>'
      ],
      [txt_file, "hello"]
    ];
  files.forEach(([fp, val]) => writeFileSync(fp, val));

  try {
    const [js_res, styl_res, svg_res, txt_res] = await Promise.all(
      [js_file, styl_file, svg_file, txt_file].map(lint)
    );

    expect(js_res).toBe("const a = 1,\n  b = 2;\n");
    expect(styl_res).toBe("body\n  color red\n");
    expect(svg_res).toContain("<svg");
    expect(svg_res.length).toBeLessThan(91);
    expect(txt_res).toBeUndefined();

    const js_file_clean = join(import.meta.dirname, "t_clean.js");
    writeFileSync(js_file_clean, js_res);
    try {
      const res_clean = await lint(js_file_clean);
      expect(res_clean).toBeUndefined();
    } finally {
      rm(js_file_clean);
    }

    const js_bin_test = join(import.meta.dirname, "t_bin.js"),
      bin_path = join(import.meta.dirname, "../src/bin.js");
    writeFileSync(js_bin_test, "const a = 1 ; \n const b = 2;");
    try {
      await $`bun ${bin_path} ${js_bin_test}`;
      const content = read(js_bin_test);
      expect(content).toBe("const a = 1,\n  b = 2;\n");

      await $`bun ${bin_path} --help`;
    } finally {
      rm(js_bin_test);
    }
  } finally {
    [js_file, styl_file, svg_file, txt_file].forEach(rm);
  }
});
