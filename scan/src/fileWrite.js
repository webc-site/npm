import trans from "./trans.js";

export default (db, to_update, to_delete) => {
  if (to_update.length > 0 || to_delete.length > 0) {
    trans(db, () => {
      if (to_update.length > 0) {
        const insert = db.prepare("INSERT OR REPLACE INTO file(hash,size,mtime)VALUES(?,?,?)");
        for (const record of to_update) {
          insert.run(...record);
        }
      }
      if (to_delete.length > 0) {
        const del = db.prepare("DELETE FROM file WHERE hash=?");
        for (const h of to_delete) {
          del.run(h);
        }
      }
    });
  }
};
