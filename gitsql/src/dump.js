import Db from "./db.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import csvE from "@1-/csv/csvE.js";
import { encode as base64e } from "./encode/base64.js";

export default async (db_path, dir_path) => {
  using db = Db(db_path);
  const tables = db
    .query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();

  await mkdir(dir_path, { recursive: true });

  for (const { name, sql } of tables) {
    await writeFile(join(dir_path, name + ".sql"), sql.endsWith(";") ? sql + "\n" : sql + ";\n");

    const cols = db
        .query("PRAGMA table_info([" + name + "])")
        .all()
        .map(({ name }) => name),
      rows = db.query("SELECT * FROM [" + name + "]").iterate(),
      writer = Bun.file(join(dir_path, name + ".csv")).writer(),
      temp_row = Array.from({ length: cols.length });

    writer.write("\ufeff" + csvE(cols) + "\n");

    for (const row of rows) {
      for (let i = 0; i < cols.length; ++i) {
        const val = row[cols[i]];
        temp_row[i] = val instanceof Uint8Array ? base64e(val) : val;
      }
      writer.write(csvE(temp_row) + "\n");
    }

    writer.flush();
    writer.end();
  }
};
