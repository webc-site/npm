#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import { rm as fsRm, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import scan from "../src/_.js";

const writeFiles = async (dir, files) => {
  for (const [path, val] of files) {
    const full = join(dir, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, val);
  }
};

test("删除多余翻译文件及检测缺失翻译", async () => {
  const test_dir = join(import.meta.dirname, "rm_test_dir"),
    db_path = join(test_dir, "scan.db");

  await writeFiles(test_dir, [
    ["doc/zh/a.md", "zh a"],
    ["doc/en/a.md", "en a"],
    ["doc/en/b.md", "en b"],
    ["doc/zh/c.md", "zh c"],
  ]);

  const tran_calls = [],
    cache_calls = [],
    update_cache = (prefix, rel, from_lang, to_lang, log) => {
      expect(typeof log).toBe("function");
      cache_calls.push([prefix, rel, from_lang, to_lang]);
    },
    tran = (prefix, rel, from_lang, to_lang, log) => {
      expect(typeof log).toBe("function");
      tran_calls.push([prefix, rel, from_lang, to_lang]);
    },
    clear = () => {
      tran_calls.length = 0;
      cache_calls.length = 0;
    };

  // 第一次运行：全部是新文件/更新文件
  await scan(test_dir, db_path, "zh", ["en"], update_cache, tran);

  expect(tran_calls.sort((a, b) => a[1].localeCompare(b[1]))).toEqual([
    ["doc", "a.md", "zh", "en"],
    ["doc", "c.md", "zh", "en"],
  ]);
  expect(cache_calls).toEqual([["doc", "a.md", "zh", "en"]]);
  expect(existsSync(join(test_dir, "doc/en/b.md"))).toBe(false);
  expect(existsSync(join(test_dir, "doc/en/a.md"))).toBe(true);

  clear();

  // 第二次运行：无文件修改，但 c.md 依然缺失译文
  await scan(test_dir, db_path, "zh", ["en"], update_cache, tran);

  expect(tran_calls).toEqual([["doc", "c.md", "zh", "en"]]);
  expect(cache_calls).toEqual([]);

  clear();
  await writeFile(join(test_dir, "doc/en/a.md"), "en a modified");

  // 第三次运行：译文 a.md 更新了
  await scan(test_dir, db_path, "zh", ["en"], update_cache, tran);

  expect(tran_calls).toEqual([["doc", "c.md", "zh", "en"]]);
  expect(cache_calls).toEqual([["doc", "a.md", "zh", "en"]]);

  await fsRm(test_dir, { recursive: true, force: true });
});
