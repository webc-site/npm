const SQLITE_ERROR = 1;

export default (db) => {
  try {
    return db.prepare("SELECT hash,size,mtime FROM scanMtimeLen").all();
  } catch (err) {
    if (err.errno === SQLITE_ERROR) {
      db.exec("CREATE TABLE scanMtimeLen(hash PRIMARY KEY,size INT UNSIGNED,mtime INT UNSIGNED)");
      return [];
    }
    throw err;
  }
};
