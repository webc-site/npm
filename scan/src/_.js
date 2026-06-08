import { BinMap } from "@3-/binmap";
import vbE from "@3-/vb/vbE.js";
import sqlite from "./sqlite.js";
import load from "./load.js";
import dirWalk from "./dirWalk.js";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import int from "@3-/int";
import hash from "./hash.js";
import trans from "./trans.js";

export default async (dir, db_path, ignore) => {
  const db = sqlite(db_path),
    existing = new BinMap(),
    db_rows = load(db);

  db_rows.forEach(({ hash, size, mtime }) => existing.set(hash, vbE([size, mtime])));

  const [scanned, to_update] = await dirWalk(dir, existing, ignore),
    to_delete = db_rows.filter(({ hash }) => !scanned.has(hash)).map(({ hash }) => hash);

  if (to_delete.length > 0) {
    trans(db, () => {
      const del = db.prepare("DELETE FROM file WHERE hash=?");
      to_delete.forEach((h) => del.run(h));
    });
  }

  const insert = db.prepare("INSERT OR REPLACE INTO file(hash,size,mtime)VALUES(?,?,?)"),
    upsert = async (rel_path) => {
      const fp = join(dir, rel_path),
        { size, mtimeMs } = await stat(fp),
        mtime = int(mtimeMs),
        h = hash(rel_path);
      insert.run(h, size, mtime);
    };

  upsert[Symbol.dispose] = () => db.close();

  return [to_update.map(([rel_path]) => rel_path), upsert];
};
