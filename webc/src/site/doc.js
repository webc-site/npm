import { existsSync } from "node:fs";
import { join } from "node:path";
import loadYml from "@1-/yml/load.js";
import write from "@3-/write";
import i18nCode from "../lib/i18nCode.js";
import mdTitle from "../lib/mdTitle.js";

const flat = (node, prefix = "", res = []) => {
    if (typeof node === "string") {
      const is_md = node.endsWith(".md"),
        key_name = is_md ? node.slice(0, -3) : node,
        file_rel = is_md ? node : node + ".md",
        pre = prefix ? prefix + "/" : "";
      res.push([pre + key_name, pre + file_rel]);
    } else if (Array.isArray(node)) {
      for (const item of node) flat(item, prefix, res);
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) flat(v, prefix ? prefix + "/" + k : k, res);
    }
    return res;
  },
  ymlLoad = (dir) => {
    const file_path = join(dir, "doc.yml");
    if (existsSync(file_path)) {
      try {
        return loadYml(file_path);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  };

export default async (root, out_dir) => {
  const code_li = await i18nCode(root),
    root_doc_yml = ymlLoad(join(root, "doc"));

  for (const lang of code_li) {
    const lang_doc_dir = join(root, "doc", lang, "doc"),
      yml_data = ymlLoad(lang_doc_dir) || root_doc_yml;

    if (!yml_data) continue;

    const item_li = flat(yml_data),
      dict = {};

    for (const [key, rel_path] of item_li) {
      dict[key] = mdTitle(join(lang_doc_dir, rel_path), key);
    }

    write(join(out_dir, lang + ".js"), "export default " + JSON.stringify(dict, null, 2) + ";\n");
  }
};
