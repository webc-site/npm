import { join, basename, dirname, relative, resolve } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";
import read from "@3-/read";
import write from "@3-/write";
import { minifyTo } from "@1-/rolldown";
import importLi from "@1-/jsparser/importLi.js";
import { compileYml } from "../lib/i18nYml.js";
import resolveExternalJs from "./plugin/resolveExternalJs.js";
import i18nPlugin, { parseI18nKeys } from "./plugin/i18n.js";
import stylPlugin from "./plugin/styl.js";
import vfsPlugin from "./plugin/vfs.js";
import define from "../lib/define.js";
import importJs from "../lib/import/js.js";
import JSON5 from "json5";

import rolldownOpt from "../lib/rolldownOpt.js";
import svgMapWrite from "../lib/svgMapWrite.js";

const WEBC = "webc",
  I18N = "i18n",
  i18n = async (name, root, lang_map, name_idx) => {
    const i18n_dir = join(root, "src", WEBC, name, I18N);
    if (!existsSync(i18n_dir)) return;

    const js_path = join(root, "src", WEBC, name, "I18N.js"),
      key_li = existsSync(js_path) ? parseI18nKeys(await read(js_path)) : [],
      idx = name_idx.get(name);

    for (const lang of readdirSync(i18n_dir)) {
      const lang_dir = join(i18n_dir, lang);
      if (statSync(lang_dir).isDirectory()) {
        const js_val = compileYml(join(lang_dir, "js.yml")),
          val_li = key_li.map((k) => js_val[k.value] ?? k.value);
        if (!lang_map.has(lang)) {
          lang_map.set(lang, Array.from({ length: name_idx.size }).fill(null));
        }
        lang_map.get(lang)[idx] = val_li;
      }
    }
  };

export default async (root, npm_dir, minify = true) => {
  // Scan for entry points in src/webc/
  const webc_dir = join(root, "src", WEBC);
  if (!existsSync(webc_dir)) return;

  const entry_li = readdirSync(webc_dir)
    .filter((file) => file.endsWith(".js") && !file.startsWith("."))
    .map((file) => join(webc_dir, file));

  if (entry_li.length === 0) return;

  const name_li = entry_li
      .map((entry) => basename(entry, ".js"))
      .filter((name) => existsSync(join(root, "src", WEBC, name, "I18N.js")))
      .sort(),
    name_idx = new Map(name_li.map((name, idx) => [name, idx])),
    out_li = entry_li.map((entry) => join(npm_dir, basename(entry))),
    js_dir = join(root, "src", "js"),
    import_set = new Set(),
    svg_map = new Map(),
    define_env = await define(root, false),
    js_copy_li = await importJs(root);
  for (const rel of js_copy_li) {
    const abs = join(js_dir, rel);
    if (existsSync(abs)) {
      import_set.add(abs);
    }
  }

  await minifyTo(
    entry_li,
    out_li,
    rolldownOpt(define_env, minify, [
      resolveExternalJs(js_dir, webc_dir, import_set),
      i18nPlugin(name_idx),
      stylPlugin(svg_map),
      vfsPlugin,
      {
        name: "rel-path",
        transform: (code) => {
          if (code.includes("../_/")) {
            return {
              code: code.replaceAll("../_/", "./_/")
            };
          }
        }
      }
    ])
  );

  // Recursively resolve imports under src/js/ and copy them
  const visited = new Set(),
    queue_li = Array.from(import_set);
  while (queue_li.length > 0) {
    const file = queue_li.shift();
    if (visited.has(file)) continue;
    visited.add(file);

    if (existsSync(file)) {
      const [static_li, dynamic_li] = importLi(await read(file));
      for (const imp of [...static_li, ...dynamic_li]) {
        if (imp.startsWith(".") || imp.startsWith("/")) {
          const abs = resolve(dirname(file), imp);
          if (abs.startsWith(js_dir + "/")) {
            queue_li.push(abs);
          }
        }
      }
    }
  }

  const input_li = Array.from(visited).filter(existsSync);
  if (input_li.length > 0) {
    const input_map = {},
      out_map = {};
    for (const file of input_li) {
      const rel = relative(js_dir, file),
        key = rel.slice(0, rel.lastIndexOf("."));
      input_map[key] = file;
      out_map[key] = join(npm_dir, "js", rel);
    }
    await minifyTo(input_map, out_map, {
      transform: {
        define: define_env
      },
      external: () => true,
      output: {
        sourcemap: false,
        minify
      }
    });
  }

  // Compile component translations
  const lang_map = new Map();
  for (const entry of entry_li) {
    await i18n(basename(entry, ".js"), root, lang_map, name_idx);
  }

  const out_i18n_dir = join(npm_dir, I18N);
  for (const [lang, comp_li] of lang_map) {
    write(join(out_i18n_dir, lang + ".js"), "export default " + JSON5.stringify(comp_li));
  }

  svgMapWrite(npm_dir, svg_map);
};
