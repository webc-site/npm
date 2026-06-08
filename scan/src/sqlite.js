import { Database } from "bun:sqlite";

export default (db_path) => {
  const db = new Database(db_path);
  db[Symbol.dispose] = () => db.close();
  return db;
};
