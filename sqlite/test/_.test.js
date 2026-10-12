#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import sqlite from "../src/_.js";
import tx from "../src/tx.js";

test("内存数据库查询", () => {
  using db = sqlite(":memory:");
  expect(db.query("select 1").all()).toEqual([{ 1: 1 }]);
});

test("自动释放", () => {
  let db;
  {
    using temp_db = sqlite(":memory:");
    db = temp_db;
  }
  expect(() => db.query("select 1")).toThrow("Cannot use a closed database");
});

test("事务提交与回滚", () => {
  using db = sqlite(":memory:");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");

  tx(db, () => {
    db.prepare("INSERT INTO users (name) VALUES (?)").run("Alice");
  });

  expect(db.query("SELECT * FROM users").all()).toEqual([{ id: 1, name: "Alice" }]);

  expect(() => {
    tx(db, () => {
      db.prepare("INSERT INTO users (name) VALUES (?)").run("Bob");
      throw new Error("rollback");
    });
  }).toThrow("rollback");

  expect(db.query("SELECT * FROM users").all()).toEqual([{ id: 1, name: "Alice" }]);
});

test("自动创建不存在的数据库目录", () => {
  const temp_dir = join(import.meta.dirname, "temp_dir"),
    db_path = join(temp_dir, "nested", "test.db");

  if (existsSync(temp_dir)) {
    rmSync(temp_dir, { recursive: true, force: true });
  }

  {
    using db = sqlite(db_path);
    expect(existsSync(join(temp_dir, "nested"))).toBe(true);
    expect(db.query("select 1").all()).toEqual([{ 1: 1 }]);
  }

  rmSync(temp_dir, { recursive: true, force: true });
});
