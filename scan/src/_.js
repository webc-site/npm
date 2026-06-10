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
  if (!existsSync(db_path)) {
    upsertGitignore(join(dirname(db_path), ".gitignore"), basename(db_path));
  }
  const db = sqlite(db_path),
    existing = new BinMap(),
    db_rows = load(db),
    limit = pLimit(availableParallelism());

  db_rows.forEach(({ hash, size, mtime }) => existing.set(hash, vbE([size, mtime])));

  const [scanned, update] = await scan(dir, files, existing, limit),
    rm_hashes = db_rows.filter(({ hash }) => !scanned.has(hash)).map(({ hash }) => hash);

  rm(db, rm_hashes);

  return [update, upsert(db, dir)];
};
