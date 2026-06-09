import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import dump from "../src/dump.js";
import load from "../src/load.js";

test("gitsql 导出与导入集成测试", async () => {
  const db_path = join(import.meta.dirname, "test.db"),
    db_path2 = join(import.meta.dirname, "test2.db"),
    dir_path = join(import.meta.dirname, "test_dir");

  for (const p of [db_path, db_path2]) {
    if (existsSync(p)) {
      await rm(p);
    }
  }
  if (existsSync(dir_path)) {
    await rm(dir_path, { recursive: true, force: true });
  }

  const db = new Database(db_path);
  db.run("CREATE TABLE [users] (id INTEGER PRIMARY KEY, name TEXT, bio TEXT, age INTEGER)");
  [
    "INSERT INTO [users] (name, bio, age) VALUES ('Alice', 'Hello, world!', 25)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Bob', 'Line 1\nLine 2', 30)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Charlie', 'He said \"Hello\"', NULL)",
    "INSERT INTO [users] (name, bio, age) VALUES ('David', '', 40)",
  ].forEach((sql) => db.run(sql));
  db.close();

  await dump(db_path, dir_path);

  expect(existsSync(join(dir_path, "users.sql"))).toBe(true);
  expect(existsSync(join(dir_path, "users.csv"))).toBe(true);

  const sql_content = await readFile(join(dir_path, "users.sql"), "utf8"),
    csv_content = await readFile(join(dir_path, "users.csv"), "utf8");

  expect(sql_content).toContain("CREATE TABLE [users]");
  ["Alice", '"Line 1\nLine 2"', '"He said ""Hello"""', "Charlie,", 'David,""'].forEach((term) =>
    expect(csv_content).toContain(term),
  );

  await load(dir_path, db_path2);

  const db2 = new Database(db_path2),
    rows = db2.query("SELECT * FROM [users]").all();

  expect(rows.length).toBe(4);
  expect(rows[0].name).toBe("Alice");
  expect(rows[1].bio).toBe("Line 1\nLine 2");
  expect(rows[2].bio).toBe('He said "Hello"');
  expect(rows[2].age).toBe(null);
  expect(rows[3].bio).toBe("");
  expect(rows[3].age).toBe(40);
  db2.close();

  await Promise.all([rm(db_path), rm(db_path2), rm(dir_path, { recursive: true })]);
});

test("gitsql CLI 与 gitsql.js 配置集成测试", async () => {
  const db_path = join(import.meta.dirname, "cli_test.db"),
    dir_path = join(import.meta.dirname, "cli_test_dir"),
    config_path = join(process.cwd(), "gitsql.js");

  if (existsSync(db_path)) {
    await rm(db_path);
  }
  if (existsSync(dir_path)) {
    await rm(dir_path, { recursive: true, force: true });
  }

  const db = new Database(db_path);
  db.run("CREATE TABLE [kv] (key TEXT PRIMARY KEY, val TEXT)");
  db.run("INSERT INTO [kv] (key, val) VALUES ('a', '1')");
  db.close();

  const relative_db = "tests/cli_test.db",
    relative_dir = "tests/cli_test_dir",
    config_content =
      'export default [{\n  db: "' + relative_db + '",\n  dir: "' + relative_dir + '"\n}];\n';

  await writeFile(config_path, config_content);

  const cli_path = join(import.meta.dirname, "../src/cli.js"),
    res_dump = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit" });

  expect(res_dump.status).toBe(0);
  expect(existsSync(join(dir_path, "kv.sql"))).toBe(true);
  expect(existsSync(join(dir_path, "kv.csv"))).toBe(true);

  await rm(db_path);

  const res_load = spawnSync("bun", ["run", cli_path, "load"], { stdio: "inherit" });

  expect(res_load.status).toBe(0);
  expect(existsSync(db_path)).toBe(true);

  const db2 = new Database(db_path),
    rows = db2.query("SELECT * FROM [kv]").all();
  expect(rows.length).toBe(1);
  expect(rows[0].key).toBe("a");
  expect(rows[0].val).toBe("1");
  db2.close();

  await Promise.all([rm(db_path), rm(dir_path, { recursive: true }), rm(config_path)]);
});

test("gitsql 批量模式集成测试", async () => {
  const db1_path = join(process.cwd(), "batch1.db"),
    db2_path = join(process.cwd(), "batch2.db"),
    dir1_path = join(process.cwd(), "batch1.db_dir"),
    dir2_path = join(process.cwd(), "batch2.db_dir"),
    config_path = join(process.cwd(), "gitsql.js");

  for (const p of [db1_path, db2_path, dir1_path, dir2_path]) {
    if (existsSync(p)) {
      await rm(p, { recursive: true, force: true });
    }
  }

  const db1 = new Database(db1_path),
    db2 = new Database(db2_path);

  db1.run("CREATE TABLE [t1] (id INTEGER PRIMARY KEY, v TEXT)");
  db1.run("INSERT INTO [t1] (v) VALUES ('hello')");
  db1.close();

  db2.run("CREATE TABLE [t2] (id INTEGER PRIMARY KEY, v TEXT)");
  db2.run("INSERT INTO [t2] (v) VALUES ('world')");
  db2.close();

  const config_content = 'export default [\n  "batch1.db",\n  "batch2.db"\n];\n';
  await writeFile(config_path, config_content);

  const cli_path = join(import.meta.dirname, "../src/cli.js"),
    res_dump = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit" });

  expect(res_dump.status).toBe(0);
  expect(existsSync(join(dir1_path, "t1.sql"))).toBe(true);
  expect(existsSync(join(dir1_path, "t1.csv"))).toBe(true);
  expect(existsSync(join(dir2_path, "t2.sql"))).toBe(true);
  expect(existsSync(join(dir2_path, "t2.csv"))).toBe(true);

  await Promise.all([rm(db1_path), rm(db2_path)]);

  const res_load = spawnSync("bun", ["run", cli_path, "load"], { stdio: "inherit" });
  expect(res_load.status).toBe(0);
  expect(existsSync(db1_path)).toBe(true);
  expect(existsSync(db2_path)).toBe(true);

  const db1_verify = new Database(db1_path),
    rows1 = db1_verify.query("SELECT * FROM [t1]").all();
  expect(rows1.length).toBe(1);
  expect(rows1[0].v).toBe("hello");
  db1_verify.close();

  const db2_verify = new Database(db2_path),
    rows2 = db2_verify.query("SELECT * FROM [t2]").all();
  expect(rows2.length).toBe(1);
  expect(rows2[0].v).toBe("world");
  db2_verify.close();

  await Promise.all([
    rm(db1_path),
    rm(db2_path),
    rm(dir1_path, { recursive: true }),
    rm(dir2_path, { recursive: true }),
    rm(config_path),
  ]);
});
