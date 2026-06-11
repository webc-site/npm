import sqlite from "@1-/sqlite";
import upsertGitignore from "@1-/upsert_gitignore";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

/*
初始化/打开修改时间和 md5 的 sqlite 数据库，并将数据库文件加入 gitignore
db_dir: 数据库存放目录
返回值: [db_mtime, db_md5]
*/
export default (db_dir) => {
  const li = ["mtime", "md5"],
    path_li = li.map((x) => join(db_dir, x + ".sqlite"));

  if (path_li.some((x) => !existsSync(x))) {
    upsertGitignore(
      join(db_dir, ".gitignore"),
      path_li.map((x) => basename(x)),
    );
  }

  return path_li.map((x) => sqlite(x));
};
