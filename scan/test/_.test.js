#!/usr/bin/env -S bun test

import read from "@3-/read";
import readFile from "@1-/read";
import { test, expect } from "bun:test";
import { mkdir, writeFile as fsWrite, rm as fsRm, utimes } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import loads from "@1-/csv/loads.js";
import b64Uint8 from "@3-/base64url/b64Uint8.js";
import vbD from "@3-/vb/vbD.js";
import { MTIME } from "../src/const.js";
import scan from "../src/_.js";

const TMP_DIR = join(import.meta.dirname, "tmp_scan_dir"),
  DB_DIR = join(TMP_DIR, "db"),
  F1 = "file1.txt",
  F2 = "file2.txt",
  F3 = "file_with_a_very_long_name_that_exceeds_sixteen_characters.txt",
  FILE_VAL = {
    [F1]: "abc",
    [F2]: "defgh",
    [F3]: "xyz",
  },
  FILES = [F1, F2, F3],
  DECODER = new TextDecoder(),
  decode = (h) => DECODER.decode(h),
  rm = (name) => fsRm(join(TMP_DIR, name)),
  write = (name, val) => fsWrite(join(TMP_DIR, name), val),
  init = async () => {
    await mkdir(DB_DIR, { recursive: true });
    await Promise.all(FILES.map((name) => write(name, FILE_VAL[name])));
  },
  clean = () => fsRm(TMP_DIR, { recursive: true, force: true }),
  readDb = () => {
    const path = join(DB_DIR, MTIME + ".csv");
    if (!existsSync(path)) return [];
    return loads(read(path))
      .map(([path, val]) => {
        const [size, mtime] = vbD(b64Uint8(val));
        return [b64Uint8(path), size, mtime];
      })
      .sort((a, b) => a[1] - b[1]);
  },
  run = async (files, expect_res, is_upsert) => {
    const [res, upsert] = await scan(TMP_DIR, DB_DIR, files);
    using _ = upsert;
    if (expect_res) {
      expect(res.sort()).toEqual(expect_res.slice().sort());
    }
    if (is_upsert) {
      await Promise.all(res.map(upsert));
    }
  },
  hasFile = (rows, name) => rows.some(([path]) => decode(path) === name),
  STEPS = [
    {
      name: "初始扫描并存入数据库",
      files: FILES,
      expect_res: FILES,
      upsert: true,
      db_len: 3,
      check: (rows) => {
        const size_3 = rows.filter(([_, size]) => size === 3);
        expect(size_3.length).toBe(2);
        expect(hasFile(size_3, F1)).toBe(true);
      },
    },
    {
      name: "列表和物理删除后清理",
      pre: () => rm(F2),
      files: [F1, F3],
      expect_res: [],
      db_len: 2,
      not_in_db: [F2],
    },
    {
      name: "物理删除但保留在列表",
      pre: () => rm(F1),
      files: [F1, F3],
      expect_res: [],
      db_len: 1,
      not_in_db: [F1],
    },
    {
      name: "修改文件后扫描",
      pre: () => write(F3, "modified_xyz"),
      files: [F3],
      expect_res: [F3],
      upsert: true,
    },
    {
      name: "只修改 mtime 但内容不改",
      pre: () => utimes(join(TMP_DIR, F3), new Date(), new Date()),
      files: [F3],
      expect_res: [],
    },
  ];

test("扫描目录记录", async () => {
  await init();
  try {
    for (const { pre, files, expect_res, upsert, db_len, not_in_db, in_db, check } of STEPS) {
      if (pre) {
        await pre();
      }
      await run(files, expect_res, upsert);
      if (db_len !== undefined || not_in_db || in_db || check) {
        const rows = readDb();
        if (db_len !== undefined) {
          expect(rows.length).toBe(db_len);
        }
        if (not_in_db) {
          not_in_db.forEach((f) => expect(hasFile(rows, f)).toBe(false));
        }
        if (in_db) {
          in_db.forEach((f) => expect(hasFile(rows, f)).toBe(true));
        }
        if (check) {
          check(rows);
        }
      }
    }
    const gitignore_content = await readFile(join(DB_DIR, ".gitignore"));
    expect(gitignore_content).toBe(MTIME + ".csv\n");
  } finally {
    await clean();
  }
});
