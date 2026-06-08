import { BinMap } from "@3-/binmap";
import vbE from "@3-/vb/vbE.js";
import sqlite from "./sqlite.js";
import load from "./load.js";
import dirWalk from "./dirWalk.js";
import save from "./save.js";

export default async (dir, db_path) => {
  using db = sqlite(db_path);
  const existing = new BinMap(),
    db_rows = load(db);

  for (const row of db_rows) {
    existing.set(row.hash, vbE([row.size, row.mtime]));
  }

  const [scanned, to_update] = await dirWalk(dir, existing),
    to_delete = [];
  for (const row of db_rows) {
    if (!scanned.has(row.hash)) {
      to_delete.push(row.hash);
    }
  }

  save(db, to_update, to_delete);
  return to_update.map(([rel_path]) => rel_path);
};
