import tx from "@1-/sqlite/tx.js";

/*
批量删除记录
db: sqlite 实例
table: 数据表名
rm: 待删除的路径 hash 数组
*/
export default (db, table, rm) => {
  if (rm.length) {
    tx(db, () => {
      const del = db.prepare("DELETE FROM " + table + " WHERE hash=?");
      rm.forEach((hash) => del.run(hash));
    });
  }
};
