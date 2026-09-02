import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import write from "@3-/write";
import importDefault from "../lib/import/default.js";

const mdLink = (name, url, desc) => "[" + name + "](" + url + ")" + (desc ? " : " + desc : ""),
  httpsPrefix = (url) => (url.startsWith("//") ? "https:" + url : url),
  addMd = (s) => (s.endsWith(".md") ? s : s + ".md"),
  siteSubJs = (site_dir, sub, lang) => join(site_dir, "_", sub, lang + ".js"),
  writeTxt = (dir, name, line_li) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    write(join(dir, name), line_li.join("\n") + "\n");
  },
  parseDefault = (file_path) => (existsSync(file_path) ? importDefault(file_path) : null),
  parseLs = (file_path) => (existsSync(file_path) ? import(file_path) : {}),
  dictLi = (dict, lang, dir_name) =>
    Object.entries(dict || {}).map(([key, item]) => {
      const [title, summary] = Array.isArray(item) ? item : [item];
      return mdLink(title || key, "../" + lang + "/" + dir_name + "/" + addMd(key), summary);
    });

export default async (dir, dist_dir) => {
  const site_dir = join(dir, "dist/site"),
    doc_llms_dir = join(dir, "doc/llms"),
    src_dir = join(dir, "src"),
    js_dir = join(src_dir, "js"),
    i18n_dir = join(js_dir, "i18n"),
    conf_dir = join(src_dir, "conf"),
    [code_li, name_li, GIT_REV, { GIT_CDN }] = await Promise.all([
      ...["CODE", "NAME"].map((name) => importDefault(i18n_dir, name + ".js")),
      importDefault(conf_dir, "GIT_REV.js"),
      import(join(conf_dir, "URL.js"))
    ]),
    cdn_base = httpsPrefix(GIT_CDN);

  for (const lang of code_li) {
    const [
        { webc: webc_li = [], css: css_li = [], base: base_li = [], js: js_li = [] } = {},
        doc_dict,
        blog_dict
      ] = await Promise.all([
        parseLs(siteSubJs(site_dir, "ls", lang)),
        ...["doc", "blog"].map((sub) => parseDefault(siteSubJs(site_dir, sub, lang)))
      ]),
      [doc_li, blog_li] = [
        [doc_dict, "doc"],
        [blog_dict, "blog"]
      ].map(([dict, type]) => dictLi(dict, lang, type)),
      lang_llms_line_li = [
        ...[...webc_li, ...css_li, ...base_li].map(([name, desc]) =>
          mdLink(name, "../../src/webc/" + name + "/i18n/" + lang + "/README.md", desc)
        ),
        ...js_li.map(([name, desc]) => mdLink(name, "../" + lang + "/js/" + name + ".md", desc)),
        ...doc_li,
        ...blog_li
      ];

    if (lang_llms_line_li.length > 0) {
      writeTxt(doc_llms_dir, lang + ".txt", lang_llms_line_li);
    }
  }

  writeTxt(dist_dir, "llms.txt", [
    "load index by your language :",
    "",
    ...code_li.map((code, i) =>
      mdLink(name_li[i], cdn_base + GIT_REV + "/doc/llms/" + code + ".txt")
    )
  ]);
};
