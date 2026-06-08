const { DatabaseSync } = await import("node:sqlite");

export default (db_path) => {
  const db = new DatabaseSync(db_path);
  db[Symbol.dispose] = () => db.close();
  return db;
};
