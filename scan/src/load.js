import sql from "./sql.js";

export default sql(
  (db) => db.query("SELECT hash,size,mtime FROM scanMtimeLen").all(),
  "CREATE TABLE scanMtimeLen(hash PRIMARY KEY,size INT UNSIGNED,mtime INT UNSIGNED)",
);
