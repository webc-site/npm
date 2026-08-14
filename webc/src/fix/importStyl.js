#!/usr/bin/env bun
import { existsSync } from "node:fs";
import read from "@3-/read";
import write from "@3-/write";
import { parse } from "yuku-parser";
import webcFile from "./webcFile.js";

const isStyl = (v) => v.includes("_.styl") || v.endsWith(".styl"),
  fixImportStyl = (fp) => {
    if (!existsSync(fp)) return;
    const code = read(fp);
    if (!code) return;

    let ast;
    try {
      ast = parse(code);
    } catch {
      return;
    }

    const { body } = ast.program,
      import_li = body.filter((n) => n.type === "ImportDeclaration");
    if (!import_li.length) return;

    const styl_idx = import_li.findIndex((n) => isStyl(n.source.value));
    if (styl_idx < 0) return;

    const styl_node = import_li[styl_idx],
      move_li = import_li.slice(styl_idx + 1).filter((n) => {
        const v = n.source.value;
        return v.startsWith("./") && !isStyl(v);
      });

    if (!move_li.length) return;

    const before_styl_li = import_li.slice(0, styl_idx),
      move_set = new Set(move_li),
      after_styl_li = import_li.slice(styl_idx + 1).filter((n) => !move_set.has(n)),
      new_order_li = [...before_styl_li, ...move_li, styl_node, ...after_styl_li],
      new_import_str = new_order_li.map((n) => code.slice(n.start, n.end)).join("\n"),
      start = import_li[0].start,
      end = import_li[import_li.length - 1].end,
      new_code = code.slice(0, start) + new_import_str + code.slice(end);

    if (new_code !== code) {
      write(fp, new_code);
    }
  },
  main = () => {
    const file_li = webcFile((fp, stat, name) => stat.isFile() && name.endsWith(".js"));

    for (const file of file_li) {
      fixImportStyl(file);
    }
  };

if (import.meta.main) {
  main();
}
