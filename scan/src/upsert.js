import { join } from "node:path";
import stat from "./stat.js";
import fileMd5 from "./fileMd5.js";

/*
创建用于插入/更新文件元数据（大小、修改时间、md5）的函数，并在资源释放时关闭数据库
db_mtime: 修改时间数据库实例
db_md5: md5 数据库实例
dir: 扫描目录
返回值: upsert 异步函数 (带有 [Symbol.dispose] 方法)
*/
export default (db_mtime, db_md5, dir) => {
  const insert_mtime = db_mtime.query(
      "INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)",
    ),
    insert_md5 = db_md5.query("INSERT OR REPLACE INTO scanMd5(hash,md5)VALUES(?,?)"),
    upsert = async (rel_path) => {
      try {
        const [size, mtime, hash] = await stat(dir, rel_path),
          path = join(dir, rel_path),
          md5 = await fileMd5(path);
        insert_mtime.run(hash, size, mtime);
        insert_md5.run(hash, md5);
      } catch {}
    };
  upsert[Symbol.dispose] = () => {
    db_mtime.close();
    db_md5.close();
  };
  return upsert;
};
