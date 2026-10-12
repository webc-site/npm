import { test, expect } from "bun:test";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import db from "../src/db.js";

test("释放连接", async () => {
  const db_path = join(import.meta.dirname, "using_test.db"),
    clean = async () => existsSync(db_path) && (await rm(db_path));
  await clean();

  let closed = false;
  {
    using conn = db(db_path);
    expect(conn).toBeDefined();
    expect(conn[Symbol.dispose]).toBeTypeOf("function");

    conn.run("CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)");
    conn.run("INSERT INTO t (v) VALUES ('test')");
    const rows = conn.query("SELECT * FROM t").all();
    expect(rows.length).toBe(1);
    expect(rows[0].v).toBe("test");

    const origin_close = conn.close;
    conn.close = () => {
      closed = true;
      origin_close.call(conn);
    };
  }

  expect(closed).toBe(true);
  await clean();
});
