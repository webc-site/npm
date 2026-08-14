import Db from "./db.js";
import { existsSync } from "node:fs";
import { readdir, unlink } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import csvD from "@1-/csv/csvD.js";
import { decode as base64d } from "./encode/base64.js";
import read from "./read.js";

const eachLine = async (file_path, onLine) => {
  const stream = Bun.file(file_path).stream(),
    decoder = new TextDecoder("utf-8");
  let buffer = "",
    in_quote = false;

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let scan_i = 0,
      line_start = 0;
    while (scan_i < buffer.length) {
      const code = buffer.charCodeAt(scan_i);
      if (code === 34) {
        in_quote = !in_quote;
      } else if (code === 10 && !in_quote) {
        onLine(
          buffer.slice(
            line_start,
            scan_i > line_start && buffer.charCodeAt(scan_i - 1) === 13 ? scan_i - 1 : scan_i
          )
        );
        line_start = scan_i + 1;
      }
      ++scan_i;
    }
    buffer = buffer.slice(line_start);
  }

  buffer += decoder.decode();
  if (buffer.endsWith("\r")) {
    buffer = buffer.slice(0, -1);
  }
  if (buffer.length > 0) {
    onLine(buffer);
  }
};

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
      let cols = null,
        col_infos = null,
        stmt = null,
        insert_many = null,
        is_first_line = true,
        batch = [];

      const onLine = (line) => {
        if (is_first_line) {
          if (line.startsWith("\ufeff")) {
            line = line.slice(1);
          }
          is_first_line = false;
          cols = csvD(line);
          if (cols.length === 0) return;

          const table_info = db.query("PRAGMA table_info([" + table_name + "])").all(),
            placeholders = Array.from({ length: cols.length }, () => "?").join(","),
            insert_sql =
              "INSERT INTO [" +
              table_name +
              "] (" +
              cols.map((c) => "[" + c + "]").join(",") +
              ") VALUES (" +
              placeholders +
              ")";

          col_infos = cols.map((col_name) => {
            const { type = "" } = table_info.find(({ name }) => name === col_name) ?? {},
              upper_type = type.toUpperCase();
            return [upper_type, /BLOB|BINARY/.test(upper_type)];
          });

          stmt = db.prepare(insert_sql);
          insert_many = db.transaction((data_rows) => {
            for (const row_data of data_rows) {
              const params = cols.map((_, idx) => {
                const val = row_data[idx],
                  [type, is_blob] = col_infos[idx];
                return val === undefined || val === null || (val === "" && type !== "TEXT")
                  ? null
                  : is_blob
                    ? base64d(val)
                    : val;
              });
              stmt.run(...params);
            }
          });
          return;
        }

        if (!cols || cols.length === 0) return;

        batch.push(csvD(line));
        if (batch.length >= 10000) {
          insert_many(batch);
          batch = [];
        }
      };

      await eachLine(join(dir_path, csv_file), onLine);

      if (batch.length > 0 && insert_many) {
        insert_many(batch);
      }
    }
  }
};
