#!/usr/bin/env bun
import { rmSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { parse } from "yuku-parser";
import read from "@3-/read";

const main = () => {
  const file_li = process.argv.slice(2);
  for (const file of file_li) {
    const fp = resolve(file);
    if (basename(fp) === "I18N.js" && existsSync(fp)) {
      const txt = read(fp);
      if (txt) {
        const res = parse(txt);
        let has_export = false;
        if (res.program && Array.isArray(res.program.body)) {
          for (const node of res.program.body) {
            if (
              node.type === "ExportNamedDeclaration" ||
              node.type === "ExportDefaultDeclaration" ||
              node.type === "ExportAllDeclaration"
            ) {
              has_export = true;
              break;
            }
          }
        }

        if (!has_export) {
          rmSync(fp);
          console.log("Deleted export-free I18N file: " + file);
        }
      }
    }
  }
};

if (import.meta.main) {
  main();
}
