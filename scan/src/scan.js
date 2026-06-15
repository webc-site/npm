import { BinSet } from "@3-/binset";
import u8eq from "@3-/u8/u8eq.js";
import vbE from "@3-/vb/vbE.js";
import { join } from "node:path";
import stat from "./stat.js";
import pathMd5 from "@1-/md5/pathMd5.js";

/*
扫描指定目录下的文件，并与已有记录进行对比
dir: 扫描目录
files: 相对路径列表
existing: 已有的元数据 Map
existing_md5: 已有的 md5 Map
limit: 并发限制器
db_mtime: 修改时间数据库实例
返回值: [scanned, update]
  scanned: 已扫描文件的 path 集合
  update: 需要更新或新增的文件相对路径列表
*/
export default async (dir, files, existing, existing_md5, limit, db_mtime) => {
  const scanned = new BinSet(),
    update = [];

  await Promise.all(
    files.map((rel_path) =>
      limit(async () => {
        try {
          const [size, mtime, path] = await stat(dir, rel_path),
            val = existing.get(path);

          scanned.add(path);

          if (!val) {
            update.push(rel_path);
          } else if (!u8eq(val, vbE([size, mtime]))) {
            const old_md5 = existing_md5.get(path);
            if (old_md5) {
              const cur_md5 = await pathMd5(join(dir, rel_path));
              if (u8eq(old_md5, cur_md5)) {
                db_mtime.set(path, vbE([size, mtime]));
                return;
              }
            }
            update.push(rel_path);
          }
        } catch {}
      }),
    ),
  );
  return [scanned, update];
};
