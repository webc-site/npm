import write from "@3-/write";
import { unlinkSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import tranFrom from "../lib/tranFrom.js";
import parse, { TYPE_FUNCTION } from "../jsDoc/parse.js";
import { list, clean } from "../jsDoc/fs.js";
import { clean as cleanName, load } from "../jsDoc/md.js";
import { MD } from "../jsDoc/const.js";
import ls from "../lib/ls.js";
import i18n from "../lib/i18n.js";

const JS = ".js",
  SRC = "src",
  DIR_JS = "js",
  _ = i18n(import.meta);

export default async (root) => {
  const lang = tranFrom(root),
    doc_dir = join(root, "doc", lang, DIR_JS),
    js_set = await ls(root, join(root, "src/_/ls")),
    active_set = new Set(),
    task_li = [];

  for (const js_name of js_set) {
    const file_path = join(root, SRC, DIR_JS, js_name + JS);
    if (!existsSync(file_path)) continue;
    const export_li = parse(file_path),
      dist_path = join(doc_dir, js_name + MD);

    active_set.add(dist_path);
    task_li.push([js_name, file_path, dist_path, export_li]);
  }

  const exist_li = await list(doc_dir, MD);
  for (const file of exist_li) {
    if (!active_set.has(file)) {
      unlinkSync(file);
    }
  }
  clean(doc_dir);

  const missing_li = [],
    miss_desc_li = [];

  for (const [js_name, file_path, dist_path, export_li] of task_li) {
    const dict = load(dist_path),
      md_li = ["# " + js_name + JS],
      miss_li = [],
      desc = dict[""];

    if (desc) {
      md_li.push(desc);
    } else if (export_li.length === 0 || export_li.length > 1) {
      const js_rel = relative(root, file_path),
        md_rel = relative(root, dist_path);
      miss_desc_li.push([js_rel, md_rel]);
    }

    for (const [type, name, param_str] of export_li) {
      const title = type === TYPE_FUNCTION ? "## " + name + "(" + param_str + ")" : "## " + name,
        val = dict[cleanName(name)];

      if (val && val.trim() !== "") {
        md_li.push(title + "\n\n" + val);
      } else {
        md_li.push(title);
        miss_li.push(name);
      }
    }

    write(dist_path, md_li.join("\n\n") + "\n");

    if (miss_li.length > 0) {
      const js_rel = relative(root, file_path),
        md_rel = relative(root, dist_path);
      missing_li.push([js_rel, md_rel, miss_li]);
    }
  }

  if (missing_li.length > 0) {
    for (const [js_rel, md_rel, symbol_li] of missing_li) {
      console.log(js_rel + " → " + md_rel);
      for (const sym of symbol_li) {
        console.log("- " + sym);
      }
    }
  }

  if (miss_desc_li.length > 0) {
    console.log(_.missDesc);
    for (const [js_rel, md_rel] of miss_desc_li) {
      console.log(js_rel + " → " + md_rel);
    }
  }
};
