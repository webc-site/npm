import { writeFileSync } from "node:fs";
import { join } from "node:path";
import dumps from "@1-/csv/dumps.js";
import vbE from "@3-/vb/vbE.js";
import uint8B64 from "@3-/base64url/uint8B64.js";
import pathMd5 from "@1-/md5/pathMd5.js";
import stat from "./stat.js";
import { MTIME, MD5 } from "./const.js";

const save = (db_dir, db, name, to_row) => {
  const li = [];
  for (const [key, val] of db.entries()) {
    li.push(to_row(key, val));
  }
  li.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  writeFileSync(join(db_dir, name + ".csv"), dumps(li), "utf8");
};

/*
创建更新文件大小、修改时间和 md5 的 upsert 函数
db_mtime: 修改时间 BinMap 实例
db_md5: md5 BinMap 实例
dir: 扫描目录
db_dir: 数据库目录
返回值: upsert 函数
*/
export default (db_mtime, db_md5, dir, db_dir) => {
  const upsert = async (rel_path) => {
    try {
      const [size, mtime, path] = await stat(dir, rel_path),
        md5 = await pathMd5(join(dir, rel_path));
      db_mtime.set(path, vbE([size, mtime]));
      db_md5.set(path, md5);
    } catch {}
  };

  upsert[Symbol.dispose] = () => {
    save(db_dir, db_mtime, MTIME, (key, val) => [uint8B64(key), uint8B64(val)]);
    save(db_dir, db_md5, MD5, (key, val) => [uint8B64(key), uint8B64(val)]);
    db_mtime[Symbol.dispose]();
    db_md5[Symbol.dispose]();
  };

  return upsert;
};
