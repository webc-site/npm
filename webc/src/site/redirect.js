import { existsSync } from "node:fs";
import { join } from "node:path";
import write from "@3-/write";

const R_200 = " / 200\n",
  urlLi = (dict, prefix) =>
    dict
      ? Object.keys(dict).map((key) => (key === "README" ? "/" + prefix : "/" + prefix + "/" + key))
      : [];

export default async (site_dir, lang) => {
  const ls_dir = join(site_dir, "_/ls"),
    doc_file = join(site_dir, "_/doc", lang + ".js"),
    blog_file = join(site_dir, "_/blog", lang + ".js"),
    { webc = [], css = [], base = [], js = [] } = await import(join(ls_dir, lang + ".js")),
    doc_dict = existsSync(doc_file) ? (await import(doc_file)).default : null,
    blog_dict = existsSync(blog_file) ? (await import(blog_file)).default : null,
    doc_li = urlLi(doc_dict, "doc"),
    blog_li = urlLi(blog_dict, "blog"),
    redirects_content =
      [
        ...[...webc, ...css, ...base].map(([name]) => "/" + name),
        ...js.map(([name]) => "/js/" + name),
        ...doc_li,
        ...blog_li
      ].join(R_200) + R_200;

  write(join(site_dir, "_redirects"), redirects_content);
};
