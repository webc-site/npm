import { existsSync, readdirSync, rmdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { MD } from "./const.js";

export const list = async (dir, ext = MD) => {
    const file_li = [];
    if (!existsSync(dir)) return file_li;

    const traverse = (current_dir) => {
      const list_li = readdirSync(current_dir);
      for (const file of list_li) {
        if (file.startsWith(".")) continue;
        const full_path = join(current_dir, file),
          stat = statSync(full_path);
        if (stat.isDirectory()) {
          traverse(full_path);
        } else if (stat.isFile() && file.endsWith(ext)) {
          file_li.push(full_path);
        }
      }
    };
    traverse(dir);
    return file_li;
  },
  clean = (dir) => {
    if (!existsSync(dir)) return;
    const list_li = readdirSync(dir);
    for (const file of list_li) {
      const full_path = join(dir, file);
      if (statSync(full_path).isDirectory()) {
        clean(full_path);
      }
    }
    if (readdirSync(dir).length === 0) {
      rmdirSync(dir);
    }
  };
