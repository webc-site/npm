import tx from "@1-/sqlite/tx.js";

/*
批量存储和更新文件修改时间
db: sqlite 实例
update: 待更新数组，格式为 [[_, hash, size, mtime]]
rm: 待删除的 hash 数组
*/
export default (db, update, rm) => {
  if (update.length || rm.length) {
    tx(db, () => {
      if (update.length) {
        const insert = db.prepare(
          "INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)",
        );
        update.forEach(([_, h, size, mtime]) => insert.run(h, size, mtime));
      }
      if (rm.length) {
        const del = db.prepare("DELETE FROM scanMtimeLen WHERE hash=?");
        rm.forEach((h) => del.run(h));
      }
    });
  }
};
