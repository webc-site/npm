#!/usr/bin/env -S bun test

import { mock, test, expect } from "bun:test";
import { Database } from "bun:sqlite";

mock.module("node:sqlite", () => ({
  DatabaseSync: class {
    constructor(path) {
      this.db = new Database(path === ":memory:" ? ":memory:" : path);
    }
    exec(sql) {
      this.db.run(sql);
    }
    prepare(sql) {
      try {
        const stmt = this.db.prepare(sql);
        return {
          run(...args) {
            try {
              return stmt.run(...args);
            } catch (err) {
              err.errcode = 1;
              throw err;
            }
          },
          all(...args) {
            try {
              return stmt.all(...args);
            } catch (err) {
              err.errcode = 1;
              throw err;
            }
          },
          get(...args) {
            try {
              return stmt.get(...args);
            } catch (err) {
              err.errcode = 1;
              throw err;
            }
          },
        };
      } catch (err) {
        err.errcode = 1;
        throw err;
      }
    }
    close() {
      this.db.close();
    }
  },
}));

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import scan from "../src/_.js";

const TMP_DIR = join(import.meta.dirname, "tmp_scan_dir"),
  DB_PATH = join(import.meta.dirname, "test.db"),
  init = async () => {
    await mkdir(TMP_DIR, { recursive: true });
    await Promise.all(
      [
        ["file1.txt", "abc"],
        ["file2.txt", "defgh"],
        ["file_with_a_very_long_name_that_exceeds_sixteen_characters.txt", "xyz"],
      ].map(([name, val]) => writeFile(join(TMP_DIR, name), val)),
    );
  },
  cleanup = () =>
    Promise.all([rm(TMP_DIR, { recursive: true, force: true }), rm(DB_PATH, { force: true })]),
  allRows = async () => {
    const { DatabaseSync } = await import("node:sqlite"),
      db = new DatabaseSync(DB_PATH),
      rows = db.prepare("SELECT * FROM file ORDER BY size").all();
    db.close();
    return rows;
  };

test("扫描目录记录", async () => {
  await init();
  try {
    const res1 = await scan(TMP_DIR, DB_PATH);
    expect(res1.sort()).toEqual(
      [
        "file1.txt",
        "file2.txt",
        "file_with_a_very_long_name_that_exceeds_sixteen_characters.txt",
      ].sort(),
    );

    let rows = await allRows();

    expect(rows.length).toBe(3);

    const size3Rows = rows.filter((r) => r.size === 3);
    expect(size3Rows.length).toBe(2);
    expect(size3Rows[0].hash instanceof Uint8Array).toBe(true);
    expect(size3Rows[1].hash instanceof Uint8Array).toBe(true);

    const decoder = new TextDecoder(),
      file1Row = size3Rows.find((r) => decoder.decode(r.hash) === "file1.txt");
    expect(file1Row).toBeDefined();

    const longNameRow = size3Rows.find((r) => r.hash.length === 16);
    expect(longNameRow).toBeDefined();

    const row2 = rows.find((r) => r.size === 5);
    expect(decoder.decode(row2.hash)).toBe("file2.txt");

    await rm(join(TMP_DIR, "file2.txt"));
    const res2 = await scan(TMP_DIR, DB_PATH);
    expect(res2).toEqual([]);

    rows = await allRows();

    expect(rows.length).toBe(2);
    expect(rows.find((r) => decoder.decode(r.hash) === "file2.txt")).toBeUndefined();

    await writeFile(join(TMP_DIR, "file1.txt"), "modified_abc");
    const res3 = await scan(TMP_DIR, DB_PATH);
    expect(res3).toEqual(["file1.txt"]);
  } finally {
    await cleanup();
  }
});
