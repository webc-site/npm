import read from "@1-/read";
import { test, expect, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import dump from "../src/dump.js";
import load from "../src/load.js";

const TMP_DIR = join(import.meta.dirname, "../../.tmp/gitsync");
mkdirSync(TMP_DIR, { recursive: true });
spawnSync("git", ["init"], { cwd: TMP_DIR, stdio: "ignore" });

const clean = async (...paths) => {
    for (const p of paths) {
      if (existsSync(p)) {
        await rm(p, { recursive: true, force: true });
      }
    }
  },
  newDb = (path, ...sqls) => {
    const db = new Database(path);
    sqls.forEach((sql) => db.run(sql));
    db.close();
  },
  queryAll = (path, sql) => {
    const db = new Database(path),
      rows = db.query(sql).all();
    db.close();
    return rows;
  };

test("gitsql 导出与导入集成测试", async () => {
  const db_path = join(TMP_DIR, "test.db"),
    db_path2 = join(TMP_DIR, "test2.db"),
    dir_path = join(TMP_DIR, "test_dir");

  await clean(db_path, db_path2, dir_path);

  newDb(
    db_path,
    "CREATE TABLE [users] (id INTEGER PRIMARY KEY, name TEXT, bio TEXT, age INTEGER)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Alice', 'Hello, world!', 25)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Bob', 'Line 1\nLine 2', 30)",
    "INSERT INTO [users] (name, bio, age) VALUES ('Charlie', 'He said \"Hello\"', NULL)",
    "INSERT INTO [users] (name, bio, age) VALUES ('David', '', 40)",
  );

  await dump(db_path, dir_path);

  expect(existsSync(join(dir_path, "users.sql"))).toBe(true);
  expect(existsSync(join(dir_path, "users.csv"))).toBe(true);

  const sql_content = await read(join(dir_path, "users.sql")),
    csv_content = await read(join(dir_path, "users.csv"));

  expect(sql_content).toContain("CREATE TABLE [users]");
  ["Alice", '"Line 1\nLine 2"', '"He said ""Hello"""', "Charlie,", 'David,""'].forEach((term) =>
    expect(csv_content).toContain(term),
  );

  await load(dir_path, db_path2);

  const rows = queryAll(db_path2, "SELECT * FROM [users]");

  expect(rows.length).toBe(4);
  expect(rows[0].name).toBe("Alice");
  expect(rows[1].bio).toBe("Line 1\nLine 2");
  expect(rows[2].bio).toBe('He said "Hello"');
  expect(rows[2].age).toBe(null);
  expect(rows[3].bio).toBe("");
  expect(rows[3].age).toBe(40);

  await clean(db_path, db_path2, dir_path);
});

test("gitsql CLI 与 gitsql.js 配置集成测试", async () => {
  const db_path = join(TMP_DIR, "cli_test.db"),
    dir_path = db_path + ".dump",
    config_path = join(TMP_DIR, "gitsql.js");

  await clean(db_path, dir_path, config_path);

  newDb(
    db_path,
    "CREATE TABLE [kv] (key TEXT PRIMARY KEY, val TEXT)",
    "INSERT INTO [kv] (key, val) VALUES ('a', '1')",
  );

  const config_content = 'export default ["cli_test.db"];\n';
  await writeFile(config_path, config_content);

  const cli_path = join(import.meta.dirname, "../src/cli.js"),
    res_dump = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit", cwd: TMP_DIR });

  expect(res_dump.status).toBe(0);
  expect(existsSync(join(dir_path, "kv.sql"))).toBe(true);
  expect(existsSync(join(dir_path, "kv.csv"))).toBe(true);

  await clean(db_path);

  const res_load = spawnSync("bun", ["run", cli_path, "load"], { stdio: "inherit", cwd: TMP_DIR });

  expect(res_load.status).toBe(0);
  expect(existsSync(db_path)).toBe(true);

  const rows = queryAll(db_path, "SELECT * FROM [kv]");
  expect(rows.length).toBe(1);
  expect(rows[0].key).toBe("a");
  expect(rows[0].val).toBe("1");

  await clean(db_path, dir_path, config_path);
  spawnSync("git", ["reset", "HEAD", dir_path, config_path], { stdio: "ignore" });
});

test("gitsql 批量模式集成测试", async () => {
  const db1_path = join(TMP_DIR, "batch1.db"),
    db2_path = join(TMP_DIR, "batch2.db"),
    dir1_path = join(TMP_DIR, "batch1.db.dump"),
    dir2_path = join(TMP_DIR, "batch2.db.dump"),
    config_path = join(TMP_DIR, "gitsql.js");

  await clean(db1_path, db2_path, dir1_path, dir2_path, config_path);

  newDb(
    db1_path,
    "CREATE TABLE [t1] (id INTEGER PRIMARY KEY, v TEXT)",
    "INSERT INTO [t1] (v) VALUES ('hello')",
  );
  newDb(
    db2_path,
    "CREATE TABLE [t2] (id INTEGER PRIMARY KEY, v TEXT)",
    "INSERT INTO [t2] (v) VALUES ('world')",
  );

  const config_content = 'export default [\n  "batch1.db",\n  "batch2.db"\n];\n';
  await writeFile(config_path, config_content);

  const cli_path = join(import.meta.dirname, "../src/cli.js"),
    res_dump = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit", cwd: TMP_DIR });

  expect(res_dump.status).toBe(0);
  expect(existsSync(join(dir1_path, "t1.sql"))).toBe(true);
  expect(existsSync(join(dir1_path, "t1.csv"))).toBe(true);
  expect(existsSync(join(dir2_path, "t2.sql"))).toBe(true);
  expect(existsSync(join(dir2_path, "t2.csv"))).toBe(true);

  await clean(db1_path, db2_path);

  const res_load = spawnSync("bun", ["run", cli_path, "load"], { stdio: "inherit", cwd: TMP_DIR });
  expect(res_load.status).toBe(0);
  expect(existsSync(db1_path)).toBe(true);
  expect(existsSync(db2_path)).toBe(true);

  const rows1 = queryAll(db1_path, "SELECT * FROM [t1]");
  expect(rows1.length).toBe(1);
  expect(rows1[0].v).toBe("hello");

  const rows2 = queryAll(db2_path, "SELECT * FROM [t2]");
  expect(rows2.length).toBe(1);
  expect(rows2[0].v).toBe("world");

  await clean(db1_path, db2_path, dir1_path, dir2_path, config_path);
  spawnSync("git", ["reset", "HEAD", dir1_path, dir2_path, config_path], { stdio: "ignore" });
});

test("gitsql 缓存（mtime + size）优化测试", async () => {
  const db_path = join(TMP_DIR, "cache_test.db"),
    dir_path = db_path + ".dump",
    config_path = join(TMP_DIR, "gitsql.js"),
    scan_db_path = join(TMP_DIR, ".cache/gitsql/scan");

  await clean(db_path, dir_path, config_path, join(TMP_DIR, ".cache"));

  newDb(
    db_path,
    "CREATE TABLE [kv] (key TEXT PRIMARY KEY, val TEXT)",
    "INSERT INTO [kv] (key, val) VALUES ('a', '1')",
  );

  const config_content = 'export default ["cache_test.db"];\n';
  await writeFile(config_path, config_content);

  const cli_path = join(import.meta.dirname, "../src/cli.js"),
    // 第一次 dump，应该生成 dump 目录
    res_dump1 = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit", cwd: TMP_DIR });
  expect(res_dump1.status).toBe(0);
  expect(existsSync(join(dir_path, "kv.csv"))).toBe(true);
  expect(existsSync(scan_db_path)).toBe(true);

  // 修改 csv 内容，测试第二次 dump 是否跳过
  const csv_file = join(dir_path, "kv.csv");
  await writeFile(csv_file, "modified");

  const res_dump2 = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit", cwd: TMP_DIR });
  expect(res_dump2.status).toBe(0);
  // 应当跳过 dump，所以内容依然是 "modified"
  expect(await read(csv_file)).toBe("modified");

  // 修改数据库，增加新纪录以改变 size/mtime
  newDb(db_path, "INSERT INTO [kv] (key, val) VALUES ('b', '2')");

  // 第三次 dump，应该重新 dump，覆写 csv 内容
  const res_dump3 = spawnSync("bun", ["run", cli_path, "dump"], { stdio: "inherit", cwd: TMP_DIR });
  expect(res_dump3.status).toBe(0);
  const csv_new_content = await read(csv_file);
  expect(csv_new_content).not.toBe("modified");
  expect(csv_new_content).toContain("b,2");

  // 清理
  await clean(db_path, dir_path, config_path, join(TMP_DIR, ".cache"));
  spawnSync("git", ["reset", "HEAD", dir_path, config_path], { stdio: "ignore" });
});

afterAll(async () => {
  await clean(TMP_DIR);
});
