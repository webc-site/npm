import _read from "@3-/read";
import { parse } from "node-html-parser";
import { existsSync } from "node:fs";
import pug from "pug";

const ct = (html) => {
  const root = parse(html, {
      blockTextElements: {
        script: true,
        style: true
      }
    }),
    key_li = [],
    key_map = new Map();

  for (const el of root.querySelectorAll("c-t")) {
    const key = el.textContent.trim();
    let idx = key_map.get(key);
    if (idx === undefined) {
      idx = key_li.length;
      key_map.set(key, idx);
      key_li.push(key);
    }
    el.textContent = idx;
  }

  return [root.toString(), key_li];
};

export default (pug_path, read = _read) => {
  if (existsSync(pug_path)) {
    const src = read(pug_path);
    return ct(pug.render(src, { filename: pug_path }));
  }
  return ["", null];
};
