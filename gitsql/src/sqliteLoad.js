import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { readdir, readFile, unlink } from "node:fs/promises";
import { join, basename, extname } from "node:path";

const parseCsv = (text) => {
    const result = [],
      len = text.length;
    let row = [],
      col = null,
      in_quotes = false;
    for (let i = 0; i < len; ++i) {
      const c = text[i];
      if (in_quotes) {
        if (c === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            col = (col || "") + '"';
            ++i;
          } else {
            in_quotes = false;
          }
        } else {
          col = (col || "") + c;
        }
      } else {
        if (c === '"') {
          in_quotes = true;
          if (col === null) col = "";
        } else if (c === ",") {
          row.push(col);
          col = null;
        } else if (c === "\n" || c === "\r") {
          if (c === "\r" && i + 1 < len && text[i + 1] === "\n") {
            ++i;
          }
          row.push(col);
          result.push(row);
          row = [];
          col = null;
        } else {
          col = (col || "") + c;
        }
      }
    }
    if (col !== null || row.length > 0) {
      row.push(col);
      result.push(row);
    }
    return result;
  },
  load = async (dir_path, db_path) => {
    if (existsSync(db_path)) {
      await unlink(db_path);
    }

    const db = new Database(db_path),
      files = await readdir(dir_path),
      sql_files = files.filter((f) => extname(f) === ".sql");

    for (const file of sql_files) {
      const table_name = basename(file, ".sql"),
        sql = await readFile(join(dir_path, file), "utf8"),
        csv_file = table_name + ".csv";
      db.run(sql);

      if (files.includes(csv_file)) {
        const csv_content = await readFile(join(dir_path, csv_file), "utf8"),
          clean_content = csv_content.replace(/\r?\n$/, ""),
          csv_data = parseCsv(clean_content);

        if (csv_data.length > 1) {
          const cols = csv_data[0],
            rows = csv_data.slice(1);

          if (rows.length > 0) {
            const placeholders = Array.from({ length: cols.length }, () => "?").join(","),
              insert_sql =
                "INSERT INTO [" +
                table_name +
                "] (" +
                cols.map((c) => "[" + c + "]").join(",") +
                ") VALUES (" +
                placeholders +
                ")",
              stmt = db.prepare(insert_sql),
              insert_many = db.transaction((data_rows) => {
                for (const row_data of data_rows) {
                  const params = cols.map((_, idx) =>
                    row_data[idx] !== undefined ? row_data[idx] : null,
                  );
                  stmt.run(...params);
                }
              });
            insert_many(rows);
          }
        }
      }
    }
    db.close();
  };

export default load;
