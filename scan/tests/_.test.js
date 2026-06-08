#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";

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
  allRows = () => {
    const db = new Database(DB_PATH),
      rows = db.prepare("SELECT * FROM file ORDER BY size").all();
    db.close();
    return rows;
  };

test("扫描目录记录", async () => {
  await init();
  try {
    {
      const [res1, upsert] = await scan(TMP_DIR, DB_PATH);
      using _upsert1 = upsert;
      expect(res1.sort()).toEqual(
        [
          "file1.txt",
          "file2.txt",
          "file_with_a_very_long_name_that_exceeds_sixteen_characters.txt",
        ].sort(),
      );

      // Save items to DB
      await Promise.all(res1.map(upsert));
    }

    let rows = allRows();

    expect(rows.length).toBe(3);

    const size_3_rows = rows.filter((r) => r.size === 3);
    expect(size_3_rows.length).toBe(2);
    size_3_rows.forEach((r) => expect(r.hash instanceof Uint8Array).toBe(true));

    const decoder = new TextDecoder(),
      file_1_row = size_3_rows.find((r) => decoder.decode(r.hash) === "file1.txt");
    expect(file_1_row).toBeDefined();

    const long_name_row = size_3_rows.find((r) => r.hash.length === 16);
    expect(long_name_row).toBeDefined();

    const row_2 = rows.find((r) => r.size === 5);
    expect(decoder.decode(row_2.hash)).toBe("file2.txt");

    await rm(join(TMP_DIR, "file2.txt"));
    {
      const [res2, upsert2] = await scan(TMP_DIR, DB_PATH);
      using _upsert2 = upsert2;
      expect(res2).toEqual([]);
    }

    rows = allRows();

    expect(rows.length).toBe(2);
    expect(rows.find((r) => decoder.decode(r.hash) === "file2.txt")).toBeUndefined();

    await writeFile(join(TMP_DIR, "file1.txt"), "modified_abc");
    {
      const [res3, upsert3] = await scan(TMP_DIR, DB_PATH);
      using _upsert3 = upsert3;
      expect(res3).toEqual(["file1.txt"]);
    }
  } finally {
    await cleanup();
  }
});

test("扫描目录记录带有 ignore", async () => {
  await init();
  try {
    const [res, upsert] = await scan(
      TMP_DIR,
      DB_PATH,
      (kind, rel_path) => rel_path !== "file2.txt",
    );
    using _upsert = upsert;
    expect(res.sort()).toEqual(
      ["file1.txt", "file_with_a_very_long_name_that_exceeds_sixteen_characters.txt"].sort(),
    );
  } finally {
    await cleanup();
  }
});
