import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export default (dir) => {
  const find = (cur) => {
    if (existsSync(join(cur, ".git"))) return cur;
    const parent = dirname(cur);
    return parent === cur ? dir : find(parent);
  };
  return find(dir);
};
