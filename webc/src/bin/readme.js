import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import read from "@3-/read";
import write from "@3-/write";

import tranFrom from "../lib/tranFrom.js";
import i18nCode from "../lib/i18nCode.js";

export const README_MD = "README.md";

export default async (root) => {
  const doc_dir = join(root, "doc"),
    dir_src_js = join(root, "src/js"),
    entry_li = await fs.readdir(doc_dir, { withFileTypes: true }),
    CODE = await i18nCode(root),
    NAME = (await import(join(dir_src_js, "i18n/NAME.js"))).default,
    { readme: readmeUrlFn } = await import(join(root, "src/conf/URL.js")),
    lang_li = entry_li
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .filter((lang) => CODE.includes(lang));

  lang_li.sort((a, b) => CODE.indexOf(a) - CODE.indexOf(b));

  const link_li = await Promise.all(
      lang_li.map(async (lang) => {
        const idx = CODE.indexOf(lang),
          name = NAME[idx],
          url = await readmeUrlFn(lang),
          img_src = "https://cdn.jsdmirror.com/gh/webc-site/svg/i18n/" + lang + ".svg";
        return '<a href="' + url + '"><img src="' + img_src + '" alt="' + name + '" /></a>';
      })
    ),
    en_readme_path = join(doc_dir, "en", "doc", README_MD),
    from_readme_path = existsSync(en_readme_path)
      ? en_readme_path
      : join(doc_dir, tranFrom(root), "doc", README_MD),
    from_content = read(from_readme_path),
    header = link_li.join(" ") + "\n\n",
    output_content = header + from_content,
    root_readme_path = join(root, README_MD);

  write(root_readme_path, output_content);
};
