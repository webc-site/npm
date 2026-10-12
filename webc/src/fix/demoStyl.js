#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { basename, join, dirname } from "node:path";
import read from "@3-/read";
import write from "@3-/write";
import webcFile from "./webcFile.js";

const IMPORT_STYL_RE =
    /^\s*@import\s+["'](?:\.\.\/)+([A-Z][a-zA-Z0-9]*)(?:\/_\.styl|\.styl)?["'];?\s*\n?/gm,
  fixDemoStyl = (styl_file) => {
    if (!existsSync(styl_file)) return;
    const content = read(styl_file);
    if (!content) return;

    const match_li = [...content.matchAll(IMPORT_STYL_RE)];
    if (!match_li.length) return;

    const comp_set = new Set(match_li.map((m) => m[1])),
      new_content = content.replace(IMPORT_STYL_RE, "").trimStart();
    write(styl_file, new_content);

    const demo_dir = dirname(styl_file),
      js_file = join(demo_dir, "_.js");

    let js_content = existsSync(js_file) ? read(js_file) : "",
      js_modified = false;

    for (const comp of comp_set) {
      const import_stmt = 'import "../../' + comp + '.js";';
      if (!js_content.includes(import_stmt)) {
        js_content = import_stmt + "\n" + js_content;
        js_modified = true;
      }
    }

    if (js_modified) {
      write(js_file, js_content);
    }
  },
  main = () => {
    const file_li = webcFile((comp_dir, stat) => {
      if (stat.isDirectory()) {
        const styl_file = join(comp_dir, "demo", "_.styl");
        if (existsSync(styl_file)) return styl_file;
      }
    });

    for (const file of file_li) {
      if (basename(file) === "_.styl" && dirname(file).endsWith("demo")) {
        fixDemoStyl(file);
      }
    }
  };

if (import.meta.main) {
  main();
}
