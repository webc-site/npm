import sql from "./sql.js";

/*
加载已记录的所有文件元数据
db: sqlite 实例
返回值: [{hash, size, mtime}]
*/
export default sql(
  (db) => db.query("SELECT hash,size,mtime FROM scanMtimeLen").all(),
  "CREATE TABLE scanMtimeLen(hash PRIMARY KEY,size INT UNSIGNED,mtime INT UNSIGNED)",
);
