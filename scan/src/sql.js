const SQLITE_ERROR = 1;

/*
包裹 sqlite 执行函数，捕获表不存在错误并自动初始化表
run: 执行函数
init_sql: 建表 SQL
返回值: 包裹后的执行函数
*/
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
