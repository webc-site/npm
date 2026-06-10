import tx from "@1-/sqlite/tx.js";

export default (db, update, rm) => {
  if (update.length > 0 || rm.length > 0) {
    tx(db, () => {
      if (update.length > 0) {
        const insert = db.prepare(
          "INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)",
        );
        update.forEach(([_, h, size, mtime]) => insert.run(h, size, mtime));
      }
      if (rm.length > 0) {
        const del = db.prepare("DELETE FROM scanMtimeLen WHERE hash=?");
        rm.forEach((h) => del.run(h));
      }
    });
  }
};
