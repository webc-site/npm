#!/usr/bin/env -S bun test

import read from "@3-/read";
import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import scan from "../src/_.js";

describe("增量翻译", () => {
  let tmp, root, db_dir, zh_dir, en_dir, zh_a, en_a;
  let tran_called = 0,
    cache_called = 0;
  let cur_tran = null;

  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), "i18n-scan-"));
    root = join(tmp, "project");
    db_dir = join(tmp, "db");
    zh_dir = join(root, "doc/zh");
    en_dir = join(root, "doc/en");
    zh_a = join(zh_dir, "a.md");
    en_a = join(en_dir, "a.md");
    [zh_dir, en_dir, db_dir].forEach((d) => mkdirSync(d, { recursive: true }));
  });

  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  const check = (prefix, rel, from, to) => {
      expect(prefix).toBe("doc");
      expect(rel).toBe("a.md");
      expect(from).toBe("zh");
      expect(to).toBe("en");
    },
    updateCache = async (prefix, rel, from, to, txt, src_id) => {
      cache_called++;
      check(prefix, rel, from, to);
      expect(txt).toBe("hello");
      expect(src_id).toBe(123);
    },
    run = (t) => scan(root, db_dir, "zh", ["en"], updateCache, t, ["doc"], ["md"]),
    wrappedTran = async (prefix, rel, from, to, txt) => {
      tran_called++;
      check(prefix, rel, from, to);
      return cur_tran ? await cur_tran(txt) : ["", 0];
    },
    cases = [
      {
        desc: "首译",
        setup: () => writeFileSync(zh_a, "你好"),
        tran: (txt) => {
          expect(txt).toBe("你好");
          return ["hello", 123];
        },
        assert: () => {
          expect(tran_called).toBe(1);
          expect(cache_called).toBe(0);
          expect(read(en_a)).toBe("hello");
        },
      },
      {
        desc: "无变",
        assert: () => {
          expect(tran_called).toBe(0);
          expect(cache_called).toBe(0);
        },
      },
      {
        desc: "更新",
        setup: () => writeFileSync(zh_a, "世界"),
        tran: (txt) => {
          expect(txt).toBe("世界");
          return ["world", 124];
        },
        assert: () => {
          expect(tran_called).toBe(1);
          expect(read(en_a)).toBe("world");
        },
      },
      {
        desc: "清理",
        setup: () => writeFileSync(join(en_dir, "b.md"), "redundant"),
        assert: () => {
          expect(tran_called).toBe(0);
          expect(existsSync(join(en_dir, "b.md"))).toBe(false);
        },
      },
    ];

  cases.forEach(({ desc, setup, tran, assert }) => {
    test(desc, async () => {
      tran_called = 0;
      cache_called = 0;
      cur_tran = tran;
      if (setup) setup();
      await run(wrappedTran);
      assert();
    });
  });
});
