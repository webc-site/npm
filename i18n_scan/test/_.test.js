#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import { rm as fsRm, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import scan from "../src/_.js";

// 批量写入文件
const writeFiles = async (dir, files) => {
    for (const [path, val] of files) {
      const full = join(dir, path);
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, val);
    }
  },
  // 初始化测试目录
  initDir = async (name) => {
    const dir = join(import.meta.dirname, name + "_test_dir"),
      db = join(dir, "scan.db");
    await fsRm(dir, { recursive: true, force: true });
    return [dir, db];
  },
  // 构造 mock 回调
  newMock = (tran_calls, cache_calls) => [
    (ext, from_lang, to_lang, txt, src_md5, log) => {
      expect(typeof log).toBe("function");
      if (src_md5) {
        expect(src_md5).toBeInstanceOf(Uint8Array);
        expect(src_md5.length).toBe(16);
      }
      cache_calls.push([from_lang, to_lang, txt, ext, src_md5]);
    },
    (ext, from_lang, to_lang, txt, log) => {
      expect(typeof ext).toBe("string");
      if (log) {
        expect(typeof log).toBe("function");
      }
      tran_calls.push([from_lang, to_lang, txt, ext]);
      return to_lang + " " + txt.slice(3);
    },
  ];

test("清除冗余并补全缺失翻译", async () => {
  const [test_dir, db_dir] = await initDir("rm");

  await writeFiles(test_dir, [
    ["doc/zh/a.md", "zh a"],
    ["doc/en/a.md", "en a"],
    ["doc/en/b.md", "en b"],
    ["doc/zh/c.md", "zh c"],
  ]);

  const tran_calls = [],
    cache_calls = [],
    [updateCache, tran] = newMock(tran_calls, cache_calls),
    runScan = () => scan(test_dir, db_dir, "zh", ["en"], updateCache, tran),
    clear = () => {
      tran_calls.length = 0;
      cache_calls.length = 0;
    };

  // 首次运行：处理新文件及更新
  await runScan();

  expect(existsSync(join(db_dir, ".gitignore"))).toBe(true);
  expect(await Bun.file(join(db_dir, ".gitignore")).text()).toBe("mtime.csv\n");

  expect(tran_calls.sort((a, b) => a[2].localeCompare(b[2]))).toEqual([
    ["zh", "en", "zh a", "md"],
    ["zh", "en", "zh c", "md"],
  ]);
  expect(cache_calls.map((i) => i.slice(0, 4))).toEqual([["zh", "en", "zh a", "md"]]);

  const exist_checks = [
    ["doc/en/b.md", false],
    ["doc/en/a.md", true],
    ["doc/en/c.md", true],
  ];
  exist_checks.forEach(([path, exist]) => {
    expect(existsSync(join(test_dir, path))).toBe(exist);
  });
  expect(await Bun.file(join(test_dir, "doc/en/c.md")).text()).toBe("en c");

  clear();

  // 二次运行：无修改不触发翻译
  await runScan();

  expect(tran_calls).toEqual([]);
  expect(cache_calls).toEqual([]);

  clear();
  await writeFile(join(test_dir, "doc/en/a.md"), "en a modified");

  // 三次运行：译文更新触发缓存更新
  await runScan();

  expect(tran_calls).toEqual([]);
  expect(cache_calls.map((i) => i.slice(0, 4))).toEqual([["zh", "en", "zh a", "md"]]);

  await fsRm(test_dir, { recursive: true, force: true });
});

test("校验 md5 存储与传递", async () => {
  const [test_dir, db_dir] = await initDir("md5");

  await writeFiles(test_dir, [
    ["doc/zh/a.md", "zh a content"],
    ["doc/en/a.md", "en a content"],
  ]);

  const tran_calls = [],
    cache_calls = [],
    [updateCache, tran] = newMock(tran_calls, cache_calls),
    runScan = () => scan(test_dir, db_dir, "zh", ["en"], updateCache, tran);

  await runScan();

  expect(cache_calls.length).toBe(1);
  expect(cache_calls[0].slice(0, 4)).toEqual(["zh", "en", "zh a content", "md"]);
  const md5_1 = cache_calls[0][4];

  await writeFile(join(test_dir, "doc/en/a.md"), "en a modified");
  cache_calls.length = 0;

  await runScan();
  expect(cache_calls.length).toBe(1);
  expect(cache_calls[0][4]).toEqual(md5_1);

  await fsRm(test_dir, { recursive: true, force: true });
});
