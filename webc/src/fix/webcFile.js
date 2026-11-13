import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

export default (filter) => {
  const arg_li = process.argv.slice(2);
  if (arg_li.length) return arg_li.map((f) => resolve(f));

  const webc_dir = resolve("src/webc"),
    file_li = [];

  if (existsSync(webc_dir)) {
    for (const name of readdirSync(webc_dir)) {
      const fp = join(webc_dir, name),
        stat = statSync(fp),
        res = filter(fp, stat, name);
      if (res) {
        file_li.push(res === true ? fp : res);
      }
    }
  }
  return file_li;
};
