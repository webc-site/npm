import sql from "./sql.js";

/*
获取路径哈希对应的文件 md5
db: sqlite 实例
hash: 路径哈希
返回值: {md5} 实例或 undefined
*/
export default sql(
  (db, hash) => db.query("SELECT md5 FROM scanMd5 WHERE hash=?").get(hash),
  "CREATE TABLE scanMd5(hash PRIMARY KEY,md5 BINARY(16))",
);
