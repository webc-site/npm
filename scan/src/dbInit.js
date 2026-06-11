import sqlite from "@1-/sqlite";
import upsertGitignore from "@1-/upsert_gitignore";
import { existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";

export default (db_path) => {
  const mtime_path = db_path + ".mtime.sqlite",
    md5_path = db_path + ".md5.sqlite";

  if (!existsSync(mtime_path) || !existsSync(md5_path)) {
    upsertGitignore(join(dirname(mtime_path), ".gitignore"), [
      basename(mtime_path),
      basename(md5_path),
    ]);
  }

  const db_mtime = sqlite(mtime_path),
    db_md5 = sqlite(md5_path);

  return [db_mtime, db_md5];
};
