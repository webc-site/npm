import sqlite from "@1-/sqlite";
import { BinMap } from "@3-/binmap";
import vbE from "@3-/vb/vbE.js";
import { availableParallelism } from "node:os";
import pLimit from "@3-/plimit";
import upsertGitignore from "@1-/upsert_gitignore";
import { existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import load from "./load.js";
import scan from "./scan.js";
import rm from "./rm.js";
import upsert from "./upsert.js";

export default async (dir, db_path, files) => {
  const mtime_path = db_path + ".mtime.sqlite",
    md5_path = db_path + ".md5.sqlite";

  if (!existsSync(mtime_path)) {
    upsertGitignore(join(dirname(mtime_path), ".gitignore"), [basename(mtime_path)]);
  }
  if (!existsSync(md5_path)) {
    upsertGitignore(join(dirname(md5_path), ".gitignore"), [basename(md5_path)]);
  }

  const db_mtime = sqlite(mtime_path),
    db_md5 = sqlite(md5_path);

  db_md5.exec("CREATE TABLE IF NOT EXISTS scanMd5(hash PRIMARY KEY,md5 BLOB)");

  const existing = new BinMap(),
    db_rows = load(db_mtime),
    limit = pLimit(availableParallelism());

  db_rows.forEach(({ hash, size, mtime }) => existing.set(hash, vbE([size, mtime])));

  const [scanned, update] = await scan(dir, files, existing, limit, db_mtime, db_md5),
    rm_hashes = db_rows.filter(({ hash }) => !scanned.has(hash)).map(({ hash }) => hash);

  rm(db_mtime, "scanMtimeLen", rm_hashes);
  rm(db_md5, "scanMd5", rm_hashes);

  return [update, upsert(db_mtime, db_md5, dir)];
};
