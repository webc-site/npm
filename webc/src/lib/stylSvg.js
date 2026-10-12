import { appendFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import read from "@3-/read";
import compileCss from "./styl/css.js";
import svgEncode from "./svgEncode.js";

export default async (styl_path, out_css_path, minify) => {
  const styl_dir = dirname(styl_path);
  let css = compileCss(await read(styl_path), styl_path, minify);

  for (const match of css.matchAll(/url\(\s*['"]?([^'")]+?\.svg)(#[^'")]*)?['"]?\s*\)/g)) {
    const [full, svg_rel_path, fragment = ""] = match,
      svg_abs_path = resolve(styl_dir, svg_rel_path);

    if (existsSync(svg_abs_path)) {
      const encoded = svgEncode(await read(svg_abs_path));
      css = css.replaceAll(full, 'url("' + encoded + fragment + '")');
    }
  }

  appendFileSync(out_css_path, css);
};
