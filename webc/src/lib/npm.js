import { join } from "node:path";
import { rmSync, existsSync } from "node:fs";
import styl from "./styl.js";
import webc from "../npm/webc.js";

export default async (root, out, minify) => {
  const npm_dir = join(root, "dist", out),
    styl_path = join(root, "src", "styl", "_.styl"),
    css_path = join(npm_dir, "_.css");

  if (existsSync(npm_dir)) {
    rmSync(npm_dir, { recursive: true, force: true });
  }

  await Promise.all([styl(styl_path, css_path, minify), webc(root, npm_dir, minify)]);
};
