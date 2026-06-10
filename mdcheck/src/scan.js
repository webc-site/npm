import { join } from "node:path";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import { FILE } from "@1-/walk";
import fileValidate from "./fileValidate.js";

export default async (dir, filter) => {
  const err_li = [];
  await walkRelIgnore(dir, async (kind, rel_path) => {
    if (kind === FILE && rel_path.endsWith(".md")) {
      const abs_path = join(dir, rel_path);
      if (filter && filter(abs_path)) {
        return;
      }
      const err = await fileValidate(abs_path);
      if (err.length) {
        err_li.push([rel_path, err]);
      }
    }
  });
  return err_li;
};
