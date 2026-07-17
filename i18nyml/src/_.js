import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import match from "@1-/oslang/match.js";
import load from "@1-/yml/load.js";

export default (dir, name) => {
  if (!existsSync(dir)) return;

  const yml = name + ".yml",
    lang_li = readdirSync(dir),
    loadFirst = (li) => {
      for (const lang of li) {
        const yml_path = join(dir, lang, yml);
        if (existsSync(yml_path)) {
          return load(yml_path);
        }
      }
    };

  return loadFirst(match(lang_li)) || loadFirst(lang_li);
};
