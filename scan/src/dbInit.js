import { BinMap } from "@3-/binmap";
import csvLoad from "@1-/csv/load.js";
import upsertGitignore from "@1-/upsert_gitignore";
import b64Uint8 from "@3-/base64url/b64Uint8.js";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { MTIME, MD5 } from "./const.js";

const load = async (file_path, db) => {
  if (existsSync(file_path)) {
    for (const [path, val] of await csvLoad(file_path)) {
      db.set(b64Uint8(path), b64Uint8(val));
    }
  }
};

/*
打开 mtime 和 md5 数据库并忽略
db_dir: 数据库目录
返回值: [db_mtime, db_md5]
*/
export default async (db_dir) => {
  const mtime_path = join(db_dir, MTIME + ".csv"),
    md5_path = join(db_dir, MD5 + ".csv"),
    db_mtime = new BinMap(),
    db_md5 = new BinMap();

  if (!existsSync(mtime_path)) {
    upsertGitignore(join(db_dir, ".gitignore"), [basename(mtime_path)]);
  }

  await Promise.all([load(mtime_path, db_mtime), load(md5_path, db_md5)]);

  return [db_mtime, db_md5];
};
