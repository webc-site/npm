import { Database } from "bun:sqlite";

export default (path, options) => {
  const conn = new Database(path, options);
  conn[Symbol.dispose] = () => conn.close();
  return conn;
};
