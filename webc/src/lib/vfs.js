import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const VFS_DIR = join(import.meta.dirname, "../vfs/webc"),
  scan = (dir, base = "") => {
    const file_li = [];
    if (!existsSync(dir)) return file_li;
    for (const file of readdirSync(dir)) {
      const full_path = join(dir, file),
        rel_path = base ? join(base, file) : file;
      if (statSync(full_path).isDirectory()) {
        file_li.push(...scan(full_path, rel_path));
      } else if (file.endsWith(".js")) {
        file_li.push({ rel_path, full_path });
      }
    }
    return file_li;
  },
  vfs_map = {};

for (const { rel_path, full_path } of scan(VFS_DIR)) {
  const mod = await import(full_path);
  vfs_map[rel_path] = mod.default;
}

const VFS_MAP = vfs_map;
export const TRANSFORM_LI = Object.entries(vfs_map);

/** @public */
export { VFS_MAP };
