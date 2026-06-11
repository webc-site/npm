import { BinMap } from "@3-/binmap";
import vbE from "@3-/vb/vbE.js";
import { availableParallelism } from "node:os";
import pLimit from "@3-/plimit";
import dbInit from "./dbInit.js";
import load from "./load.js";
import scan from "./scan.js";
import rm from "./rm.js";
import upsert from "./upsert.js";

/*
扫描指定目录下文件列表，比对缓存并做清理，返回更新列表和 upsert 存储函数
dir: 扫描的目标目录
db_dir: 数据库存放目录
files: 待扫描的文件列表
返回值: [update, upsert]
  update: 发生变动需要更新的相对路径列表
  upsert: 用于将新扫描记录保存至数据库的 dispose 异步函数
*/
export default async (dir, db_dir, files) => {
  const [db_mtime, db_md5] = dbInit(db_dir),
    existing = new BinMap(),
    db_rows = load(db_mtime),
    limit = pLimit(availableParallelism());

  db_rows.forEach(({ hash, size, mtime }) => existing.set(hash, vbE([size, mtime])));

  const [scanned, update] = await scan(dir, files, existing, limit, db_mtime, db_md5),
    rm_hashes = db_rows.filter(({ hash }) => !scanned.has(hash)).map(({ hash }) => hash);

  rm(db_mtime, "scanMtimeLen", rm_hashes);
  rm(db_md5, "scanMd5", rm_hashes);

  return [update, upsert(db_mtime, db_md5, dir)];
};
