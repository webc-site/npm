import Db from "./db.js";
import { existsSync, createReadStream } from "node:fs";
import { readdir, unlink } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import decode from "./csv/decode.js";
import read from "./read.js";

export default async (dir_path, db_path) => {
  if (existsSync(db_path)) {
    await unlink(db_path);
  }

  using db = Db(db_path);
  const files = await readdir(dir_path),
    sql_files = files.filter((f) => extname(f) === ".sql");

  for (const file of sql_files) {
    const table_name = basename(file, ".sql"),
      sql = await read(join(dir_path, file)),
      csv_file = table_name + ".csv";
    db.run(sql);

    if (files.includes(csv_file)) {
      const csv_stream = createReadStream(join(dir_path, csv_file), "utf8");
      let cols = null,
        batch = [],
        stmt = null,
        insert_many = null;

      for await (const row of decode(csv_stream)) {
        if (!cols) {
          cols = row;
          const placeholders = Array.from({ length: cols.length }, () => "?").join(","),
            insert_sql =
              "INSERT INTO [" +
              table_name +
              "] (" +
              cols.map((c) => "[" + c + "]").join(",") +
              ") VALUES (" +
              placeholders +
              ")";
          stmt = db.prepare(insert_sql);
          insert_many = db.transaction((data_rows) => {
            for (const row_data of data_rows) {
              const params = cols.map((_, idx) =>
                row_data[idx] !== undefined ? row_data[idx] : null,
              );
              stmt.run(...params);
            }
          });
          continue;
        }

        batch.push(row);
        if (batch.length >= 10000) {
          insert_many(batch);
          batch = [];
        }
      }

      if (batch.length > 0) {
        insert_many(batch);
      }
    }
  }
};
