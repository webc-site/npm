import Db from "./db.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import encode from "./csv/encode.js";

export default async (db_path, dir_path) => {
  using db = Db(db_path);
  const tables = db
    .query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();

  await mkdir(dir_path, { recursive: true });

  for (const { name, sql } of tables) {
    const sql_content = sql.endsWith(";") ? sql + "\n" : sql + ";\n";
    await writeFile(join(dir_path, name + ".sql"), sql_content);

    const cols = db
        .query("PRAGMA table_info([" + name + "])")
        .all()
        .map(({ name }) => name),
      rows = db.query("SELECT * FROM [" + name + "]").iterate();

    await pipeline(
      Readable.from(encode(cols, rows)),
      createWriteStream(join(dir_path, name + ".csv")),
    );
  }
};
