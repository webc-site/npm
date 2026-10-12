export default (db, run) => {
  db.exec("BEGIN");
  try {
    const res = run();
    db.exec("COMMIT");
    return res;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
};
