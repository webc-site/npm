import { BinMap } from "@3-/binmap";
import vbE from "@3-/vb/vbE.js";
import { availableParallelism } from "node:os";
import pLimit from "@3-/plimit";
import dbInit from "./dbInit.js";
import load from "./load.js";
import scan from "./scan.js";
import rm from "./rm.js";
import upsert from "./upsert.js";

export default async (dir, db_path, files) => {
  const [db_mtime, db_md5] = dbInit(db_path),
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
