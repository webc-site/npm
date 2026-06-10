#!/usr/bin/env -S bun test

import readFile from "@1-/read";
import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, writeFile as fsWrite, rm as fsRm } from "node:fs/promises";
import { join } from "node:path";
import scan from "../src/_.js";

const TMP_DIR = join(import.meta.dirname, "tmp_scan_dir"),
  DB_DIR = join(TMP_DIR, "db"),
  DB_PATH = join(DB_DIR, "test.db"),
  FILES = [
    "file1.txt",
    "file2.txt",
    "file_with_a_very_long_name_that_exceeds_sixteen_characters.txt",
  ],
  DECODER = new TextDecoder(),
  decode = (h) => DECODER.decode(h),
  rm = (name) => fsRm(join(TMP_DIR, name)),
  write = (name, val) => fsWrite(join(TMP_DIR, name), val),
  init = async () => {
    await mkdir(DB_DIR, { recursive: true });
    await Promise.all(
      [
        ["file1.txt", "abc"],
        ["file2.txt", "defgh"],
        [FILES[2], "xyz"],
      ].map(([name, val]) => write(name, val)),
    );
  },
  clean = () => fsRm(TMP_DIR, { recursive: true, force: true }),
  read = () => {
    const db = new Database(DB_PATH),
      rows = db.prepare("SELECT * FROM scanMtimeLen ORDER BY size").all();
    db.close();
    return rows;
  },
  run = async (files, expect_res, is_upsert) => {
    const [res, upsert] = await scan(TMP_DIR, DB_PATH, files);
    using _ = upsert;
    if (expect_res) {
      expect(res.sort()).toEqual(expect_res.slice().sort());
    }
    if (is_upsert) {
      await Promise.all(res.map(upsert));
    }
  },
  STEPS = [
    {
      name: "初始扫描并存入数据库",
      files: FILES,
      expect_res: FILES,
      upsert: true,
      check: (rows) => {
        expect(rows.length).toBe(3);
        const size_3 = rows.filter(({ size }) => size === 3);
        expect(size_3.length).toBe(2);
        expect(size_3.find(({ hash }) => decode(hash) === "file1.txt")).toBeDefined();
      },
    },
    {
      name: "列表和物理删除后清理",
      pre: () => rm("file2.txt"),
      files: ["file1.txt", FILES[2]],
      expect_res: [],
      check: (rows) => {
        expect(rows.length).toBe(2);
        expect(rows.find(({ hash }) => decode(hash) === "file2.txt")).toBeUndefined();
      },
    },
    {
      name: "物理删除但保留在列表",
      pre: () => rm("file1.txt"),
      files: ["file1.txt", FILES[2]],
      expect_res: [],
      check: (rows) => {
        expect(rows.length).toBe(1);
        expect(rows.find(({ hash }) => decode(hash) === "file1.txt")).toBeUndefined();
      },
    },
    {
      name: "修改文件后扫描",
      pre: () => write(FILES[2], "modified_xyz"),
      files: [FILES[2]],
      expect_res: [FILES[2]],
    },
  ];

test("扫描目录记录", async () => {
  await init();
  try {
    for (const { pre, files, expect_res, upsert, check } of STEPS) {
      if (pre) {
        await pre();
      }
      await run(files, expect_res, upsert);
      if (check) {
        check(read());
      }
    }
    const gitignore_content = await readFile(join(DB_DIR, ".gitignore"));
    expect(gitignore_content).toBe("test.db\n");
  } finally {
    await clean();
  }
});
