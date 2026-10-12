import { readdirSync, statSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import loadYml from "@1-/yml/load.js";
import write from "@3-/write";
import tranFrom from "./tranFrom.js";

const toConst = (s) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .toUpperCase(),
  walk = (dir, from, yml_set, i18n_set) => {
    for (const item of readdirSync(dir)) {
      if (item.startsWith(".")) continue;
      const full = join(dir, item),
        stat = statSync(full);
      if (stat.isDirectory()) {
        if (item === "i18n") {
          const yml_path = join(full, from, "js.yml");
          if (existsSync(yml_path)) {
            yml_set.add(yml_path);
          }
        } else {
          walk(full, from, yml_set, i18n_set);
        }
      } else if (item === "I18N.js") {
        i18n_set.add(full);
      }
    }
  };

export default async (root = process.cwd()) => {
  const webc_dir = join(root, "src/webc");
  if (!existsSync(webc_dir)) return;

  const from = tranFrom(root) || "en",
    yml_set = new Set(),
    i18n_set = new Set(),
    valid_i18n_set = new Set();

  walk(webc_dir, from, yml_set, i18n_set);

  for (const yml_path of yml_set) {
    const comp_dir = dirname(dirname(dirname(yml_path))),
      out_path = join(comp_dir, "I18N.js"),
      data = loadYml(yml_path),
      key_li = data ? Object.keys(data) : [];

    if (key_li.length > 0) {
      const decl_li = key_li.map((k) => toConst(k) + " = " + JSON.stringify(k)),
        code = "export const " + decl_li.join(",\n  ") + ";\n";
      write(out_path, code);
      valid_i18n_set.add(out_path);
    }
  }

  for (const file of i18n_set) {
    if (!valid_i18n_set.has(file)) {
      rmSync(file);
    }
  }
};
