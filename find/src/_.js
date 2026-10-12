import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export default (root, name) => {
  let cur = root;
  for (;;) {
    if (existsSync(join(cur, name))) {
      return cur;
    }
    const parent = dirname(cur);
    if (parent === cur) {
      break;
    }
    cur = parent;
  }
};
