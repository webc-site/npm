const SQLITE_ERROR = 1;

export default (run, init_sql) =>
  (db, ...args) => {
    try {
      return run(db, ...args);
    } catch (err) {
      if (err.errno === SQLITE_ERROR) {
        db.exec(init_sql);
        return run(db, ...args);
      }
      throw err;
    }
  };
