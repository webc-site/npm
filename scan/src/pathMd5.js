import sql from "./sql.js";

export default sql(
  (db, hash) => db.query("SELECT md5 FROM scanMd5 WHERE hash = ?").get(hash),
  "CREATE TABLE scanMd5(hash PRIMARY KEY,md5 BLOB)",
);
