import { existsSync } from "node:fs";
import { join } from "node:path";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import { FILE } from "@1-/walk";
import read from "@3-/read";
import write from "@3-/write";
import loadsYml from "@1-/yml/loads.js";
import i18nCode from "../lib/i18nCode.js";
import mdTitle from "../lib/mdTitle.js";

const parseMd = (file_path, url) => {
    const trimmed = read(file_path).trimStart();
    let date = "",
      summary = "";

    if (trimmed.startsWith("---")) {
      const end_pos = trimmed.indexOf("\n---", 3);
      if (end_pos !== -1) {
        try {
          const head = loadsYml(trimmed.slice(3, end_pos));
          if (head) {
            if (head.date) date = String(head.date).trim();
            if (head.summary) summary = String(head.summary).trim();
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    return [url, mdTitle(file_path, url) || "", summary, date];
  },
  langBlog = async (blog_dir) => {
    const item_li = [];
    await walkRelIgnore(blog_dir, (kind, rel_path) => {
      if (kind === FILE && rel_path.endsWith(".md")) {
        item_li.push(parseMd(join(blog_dir, rel_path), rel_path.slice(0, -3)));
      }
    });

    if (!item_li.length) return null;

    item_li.sort((a, b) => (b[3] ? new Date(b[3]) : 0) - (a[3] ? new Date(a[3]) : 0));

    return Object.fromEntries(
      item_li.map(([url, title, summary, date]) => [url, [title, summary, date]])
    );
  };

export default async (root, out_dir) => {
  const code_li = await i18nCode(root);

  for (const lang of code_li) {
    const blog_dir = join(root, "doc", lang, "blog");
    if (!existsSync(blog_dir)) continue;

    const dict = await langBlog(blog_dir);
    if (dict) {
      write(join(out_dir, lang + ".js"), "export default " + JSON.stringify(dict, null, 2) + ";\n");
    }
  }
};
