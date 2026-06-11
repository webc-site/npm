import tx from "@1-/sqlite/tx.js";

export default (db, table, rm) => {
  if (rm.length > 0) {
    tx(db, () => {
      const del = db.prepare("DELETE FROM " + table + " WHERE hash=?");
      rm.forEach((hash) => del.run(hash));
    });
  }
};
