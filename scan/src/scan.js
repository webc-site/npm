import { BinSet } from "@3-/binset";
import u8eq from "@3-/u8/u8eq.js";
import vbE from "@3-/vb/vbE.js";
import { join } from "node:path";
import pathMd5 from "./pathMd5.js";
import stat from "./stat.js";
import fileMd5 from "./fileMd5.js";

/*
扫描指定目录下的文件，并与已有记录进行对比
dir: 扫描目录
files: 相对路径列表
existing: 已有的元数据 Map
limit: 并发限制器
db_mtime: 修改时间数据库实例
db_md5: md5 数据库实例
返回值: [scanned, update]
  scanned: 已扫描文件的 hash 集合
  update: 需要更新或新增的文件相对路径列表
*/
export default async (dir, files, existing, limit, db_mtime, db_md5) => {
  const scanned = new BinSet(),
    update = [],
    update_mtime = db_mtime.query(
      "INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)",
    );

  await Promise.all(
    files.map((rel_path) =>
      limit(async () => {
        try {
          const [size, mtime, hash] = await stat(dir, rel_path),
            val = existing.get(hash);

          scanned.add(hash);

          const row = pathMd5(db_md5, hash);

          if (!val) {
            update.push(rel_path);
          } else if (!u8eq(val, vbE([size, mtime]))) {
            if (row) {
              const cur_md5 = await fileMd5(join(dir, rel_path));
              if (u8eq(row.md5, cur_md5)) {
                update_mtime.run(hash, size, mtime);
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
