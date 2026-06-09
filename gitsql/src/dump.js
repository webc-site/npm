import Db from "./db.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const toCsv = (cols, rows) => {
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    if (val instanceof Uint8Array) {
      return '"' + Buffer.from(val).toString("base64") + '"';
    }
    const str = String(val);
    if (str === "" || /[,"\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  return (
    [cols.join(","), ...rows.map((row) => cols.map((col) => escape(row[col])).join(","))].join(
      "\n",
    ) + "\n"
  );
};

export default async (db_path, dir_path) => {
  using db = Db(db_path);
  const tables = db
    .query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();

  await mkdir(dir_path, { recursive: true });

  for (const { name, sql } of tables) {
    const sql_content = sql.endsWith(";") ? sql + "\n" : sql + ";\n";
    await writeFile(join(dir_path, name + ".sql"), sql_content);

    const rows = db.query("SELECT * FROM [" + name + "]").all(),
      cols = db
        .query("PRAGMA table_info([" + name + "])")
        .all()
        .map(({ name }) => name),
      csv_content = toCsv(cols, rows);

    await writeFile(join(dir_path, name + ".csv"), csv_content);
  }
};
