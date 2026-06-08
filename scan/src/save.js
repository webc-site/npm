import trans from "./trans.js";

export default (db, to_update, to_delete) => {
  if (to_update.length > 0 || to_delete.length > 0) {
    trans(db, () => {
      if (to_update.length > 0) {
        const insert = db.prepare("INSERT OR REPLACE INTO file(hash,size,mtime)VALUES(?,?,?)");
        to_update.forEach(([_, h, size, mtime]) => insert.run(h, size, mtime));
      }
      if (to_delete.length > 0) {
        const del = db.prepare("DELETE FROM file WHERE hash=?");
        to_delete.forEach((h) => del.run(h));
      }
    });
  }
};
