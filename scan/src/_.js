import { availableParallelism } from "node:os";
import pLimit from "@3-/plimit";
import dbInit from "./dbInit.js";
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
  const [db_mtime, db_md5] = await dbInit(db_dir),
    existing_mtime = db_mtime,
    existing_md5 = db_md5,
    limit = pLimit(availableParallelism()),
    [scanned, update] = await scan(dir, files, existing_mtime, existing_md5, limit, db_mtime),
    rm_paths = (existing) => [...existing.keys()].filter((path) => !scanned.has(path));

  [
    [db_mtime, existing_mtime],
    [db_md5, existing_md5],
  ].forEach(([db, existing]) => rm(db, rm_paths(existing)));

  return [update, upsert(db_mtime, db_md5, dir, db_dir)];
};
