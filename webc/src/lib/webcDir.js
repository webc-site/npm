import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import ERR from "@3-/log/ERR.js";

export default (root) => {
  let dir = root;
  while (dir) {
    const src_dir = join(dir, "src");
    if (existsSync(src_dir)) {
      const webc_dir = join(src_dir, "webc");
      if (!existsSync(webc_dir)) {
        mkdirSync(webc_dir);
      }
      return webc_dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  ERR("src directory not found in " + root);
};
