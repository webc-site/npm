#!/usr/bin/env bun

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import read from "@3-/read";

const HTML = ".html",
  INDEX_HTML = "index" + HTML,
  main = (root) => {
    const dist_dir = join(root, "dist/dist"),
      redirect_file = join(dist_dir, "_redirects"),
      index_html = join(dist_dir, INDEX_HTML);

    if (!existsSync(redirect_file) || !existsSync(index_html)) return;

    const content = read(redirect_file),
      line_li = content.split("\n"),
      copied_set = new Set();
    line_li.forEach((raw_line) => {
      const line = raw_line.trim();
      if (!line || line.startsWith("#")) return;
      const [from] = line.split(/\s+/);
      if (from && from.startsWith("/") && !copied_set.has(from)) {
        copied_set.add(from);
        const name = from.endsWith(HTML) ? from.slice(1) : from.slice(1) + HTML,
          dest = join(dist_dir, name),
          dir = dirname(dest);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        copyFileSync(index_html, dest);
      }
    });
  };

if (import.meta.main) {
  main(process.cwd());
}

export default main;
