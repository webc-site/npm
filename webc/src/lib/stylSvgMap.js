import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import read from "@3-/read";
import md5 from "@3-/base64url/md5B64.js";
import compileCss from "./styl/css.js";
import svgEncode from "./svgEncode.js";

export default async (code, id, svg_map) => {
  let css_content = compileCss(code, id, true);
  const match_li = [...css_content.matchAll(/url\(\s*['"]?([^'")]+?\.svg)(#[^'")]*)?['"]?\s*\)/g)],
    hash_set = new Set();

  for (const match of match_li) {
    const [full, svg_rel_path, fragment = ""] = match,
      svg_abs_path = resolve(dirname(id), svg_rel_path);

    if (existsSync(svg_abs_path)) {
      const svg_content = await read(svg_abs_path),
        hash = md5(svg_content),
        var_suffix = fragment ? "_" + fragment.slice(1) : "",
        var_name = "--" + hash + var_suffix,
        encoded = svgEncode(svg_content);

      css_content = css_content.replaceAll(full, "var(" + var_name + ")");
      hash_set.add(hash);

      if (!svg_map.has(hash)) {
        svg_map.set(hash, new Set());
      }
      svg_map.get(hash).add(":root{" + var_name + ':url("' + encoded + fragment + '")}');
    }
  }

  return [css_content, hash_set];
};
