import read from "@1-/read";
import { test, expect, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import dump from "../src/dump.js";
import load from "../src/load.js";
import DB_PATH from "../src/const/DB_PATH.js";

const TMP_DIR = join(import.meta.dirname, "../../.tmp/gitsync"),
  CLI_PATH = join(import.meta.dirname, "../src/cli.js"),
  SCAN_DB_PATH = join(TMP_DIR, DB_PATH),
  CACHE_DIR = join(TMP_DIR, ".cache"),
  clean = (...paths) => Promise.all(paths.map((p) => rm(p, { recursive: true, force: true }))),
  reset = (...paths) => spawnSync("git", ["reset", "HEAD", ...paths], { stdio: "ignore" }),
  create = (path, ...sqls) => {
    const db = new Database(path);
    sqls.forEach((sql) => db.run(sql));
    db.close();
  },
  query = (path, sql) => {
    const db = new Database(path),
      rows = db.query(sql).all();
    db.close();
    return rows;
  },
  run = (...args) => {
    const res = spawnSync("bun", ["run", CLI_PATH, ...args], { stdio: "inherit", cwd: TMP_DIR });
    expect(res.status).toBe(0);
  },
  expectDump = (dir, name) =>
    [name + ".sql", name + ".csv"].forEach((f) => expect(existsSync(join(dir, f))).toBe(true));

mkdirSync(TMP_DIR, { recursive: true });
spawnSync("git", ["init"], { cwd: TMP_DIR, stdio: "ignore" });

test("基础导出导入", async () => {
  const db_path = join(TMP_DIR, "test.db"),
    db_path2 = join(TMP_DIR, "test2.db"),
    dir_path = join(TMP_DIR, "test_dir"),
    sql_file = join(dir_path, "users.sql"),
    csv_file = join(dir_path, "users.csv");

  await clean(db_path, db_path2, dir_path);

  create(
    db_path,
    "CREATE TABLE [users] (id INTEGER PRIMARY KEY, name TEXT, bio TEXT, age INTEGER)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Alice', 'Hello, world!', 25)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Bob', 'Line 1\nLine 2', 30)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Charlie', 'He said \"Hello\"', NULL)",
    "INSERT INTO [users] (name, bio, age) VALUES ('David', '', 40)"
  );

  await dump(db_path, dir_path);

  expectDump(dir_path, "users");

  const [sql_content, csv_content] = await Promise.all([read(sql_file), read(csv_file)]);

  expect(sql_content).toContain("CREATE TABLE [users]");
  ["Alice", '"Line 1\nLine 2"', '"He said ""Hello"""', "Charlie,", "David,,"].forEach((term) =>
    expect(csv_content).toContain(term)
  );

  await load(dir_path, db_path2);

  expect(query(db_path2, "SELECT * FROM [users]")).toEqual([
    { id: 1, name: "Alice", bio: "Hello, world!", age: 25 },
    { id: 2, name: "Bob", bio: "Line 1\nLine 2", age: 30 },
    { id: 3, name: "Charlie", bio: 'He said "Hello"', age: null },
    { id: 4, name: "David", bio: "", age: 40 }
  ]);

  await clean(db_path, db_path2, dir_path);
});

[
  [
    "二进制导出导入",
    "blob_test",
    "blobs",
    "CREATE TABLE [blobs] (id INTEGER PRIMARY KEY, data BLOB)",
    "INSERT INTO [blobs] (data) VALUES (x'48656c6c6f')",
    Buffer.from([72, 101, 108, 108, 111]),
    "SGVsbG8"
  ],
  [
    "16字节二进制导出导入",
    "bin_test",
    "binaries",
    "CREATE TABLE [binaries] (id INTEGER PRIMARY KEY, data BINARY(16))",
    "INSERT INTO [binaries] (data) VALUES (x'000102030405060708090a0b0c0d0e0f')",
    Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
    "AAECAwQFBgcICQoLDA0ODw"
  ]
].forEach(([title, prefix, table, ddl, dml, buf, base_64]) => {
  test(title, async () => {
    const db_path = join(TMP_DIR, prefix + ".db"),
      db_path2 = join(TMP_DIR, prefix + "2.db"),
      dir_path = join(TMP_DIR, prefix + "_dir"),
      csv_file = join(dir_path, table + ".csv");

    await clean(db_path, db_path2, dir_path);

    create(db_path, ddl, dml);

    await dump(db_path, dir_path);

    expectDump(dir_path, table);

    expect(await read(csv_file)).toContain(base_64);

    await load(dir_path, db_path2);

    expect(query(db_path2, "SELECT * FROM [" + table + "]")).toEqual([{ id: 1, data: buf }]);

    await clean(db_path, db_path2, dir_path);
  });
});

test("CLI配置", async () => {
  const db_path = join(TMP_DIR, "cli_test.db"),
    dir_path = db_path + ".dump";

  await clean(db_path, dir_path);

  create(
    db_path,
    "CREATE TABLE [kv] (key TEXT PRIMARY KEY, val TEXT)",
    "INSERT INTO [kv] (key, val) VALUES ('a', '1')"
  );

  run("dump", "cli_test.db");
  expectDump(dir_path, "kv");

  await clean(db_path);

  run("load", "cli_test.db");
  expect(existsSync(db_path)).toBe(true);

  expect(query(db_path, "SELECT * FROM [kv]")).toEqual([{ key: "a", val: "1" }]);

  await clean(db_path, dir_path);
  reset(dir_path);
});

test("批量模式", async () => {
  const db1_path = join(TMP_DIR, "batch1.db"),
    db2_path = join(TMP_DIR, "batch2.db"),
    dir1_path = db1_path + ".dump",
    dir2_path = db2_path + ".dump";

  await clean(db1_path, db2_path, dir1_path, dir2_path);

  [
    [
      db1_path,
      "CREATE TABLE [t1] (id INTEGER PRIMARY KEY, v TEXT)",
      "INSERT INTO [t1] (v) VALUES ('hello')"
    ],
    [
      db2_path,
      "CREATE TABLE [t2] (id INTEGER PRIMARY KEY, v TEXT)",
      "INSERT INTO [t2] (v) VALUES ('world')"
    ]
  ].forEach(([path, ...sqls]) => create(path, ...sqls));

  run("dump", "batch1.db");
  run("dump", "batch2.db");

  expectDump(dir1_path, "t1");
  expectDump(dir2_path, "t2");

  await clean(db1_path, db2_path);

  run("load", "batch1.db");
  run("load", "batch2.db");
  [db1_path, db2_path].forEach((p) => expect(existsSync(p)).toBe(true));

  [
    [db1_path, "SELECT * FROM [t1]", [{ id: 1, v: "hello" }]],
    [db2_path, "SELECT * FROM [t2]", [{ id: 1, v: "world" }]]
  ].forEach(([path, sql, exp]) => expect(query(path, sql)).toEqual(exp));

  await clean(db1_path, db2_path, dir1_path, dir2_path);
  reset(dir1_path, dir2_path);
});

test("缓存优化", async () => {
  const db_path = join(TMP_DIR, "cache_test.db"),
    dir_path = db_path + ".dump",
    csv_file = join(dir_path, "kv.csv");

  await clean(db_path, dir_path, CACHE_DIR);

  create(
    db_path,
    "CREATE TABLE [kv] (key TEXT PRIMARY KEY, val TEXT)",
    "INSERT INTO [kv] (key, val) VALUES ('a', '1')"
  );

  run("dump", "cache_test.db");
  [csv_file, join(SCAN_DB_PATH, "mtime.sqlite")].forEach((p) => expect(existsSync(p)).toBe(true));

  await writeFile(csv_file, "modified");

  run("dump", "cache_test.db");
  expect(await read(csv_file)).toBe("modified");

  create(db_path, "INSERT INTO [kv] (key, val) VALUES ('b', '2')");

  run("dump", "cache_test.db");
  const csv_new_content = await read(csv_file);
  expect(csv_new_content).not.toBe("modified");
  expect(csv_new_content).toContain("b,2");

  await clean(db_path, dir_path, CACHE_DIR);
  reset(dir_path);
});

test("缓存MD5同步", async () => {
  const db_path = join(TMP_DIR, "cache_md5.db"),
    dir_path = db_path + ".dump",
    md5_dump_path = join(SCAN_DB_PATH, "md5.sqlite.dump"),
    csv_file = join(dir_path, "kv.csv");

  await clean(db_path, dir_path, CACHE_DIR);

  create(
    db_path,
    "CREATE TABLE [kv] (key TEXT PRIMARY KEY, val TEXT)",
    "INSERT INTO [kv] (key, val) VALUES ('a', '1')"
  );

  run("dump", "cache_md5.db");
  [csv_file, md5_dump_path].forEach((p) => expect(existsSync(p)).toBe(true));

  await clean(db_path, CACHE_DIR);
  expect(existsSync(join(SCAN_DB_PATH, "md5.sqlite"))).toBe(false);

  run("load", "cache_md5.db");
  [db_path, join(SCAN_DB_PATH, "md5.sqlite")].forEach((p) => expect(existsSync(p)).toBe(true));

  await writeFile(csv_file, "modified");

  run("dump", "cache_md5.db");
  expect(await read(csv_file)).toBe("modified");

  await clean(db_path, dir_path, CACHE_DIR);
  reset(dir_path, md5_dump_path);
});

test("参数错误警告", async () => {
  const { status, stderr } = spawnSync("bun", [CLI_PATH, "dump"], { cwd: TMP_DIR, stdio: "pipe" });
  expect(status).toBe(1);
  expect(stderr?.toString()).toContain("non-option");
});

afterAll(() => clean(TMP_DIR));
