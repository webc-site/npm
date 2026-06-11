#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import tranLiGen from "../src/tranLiGen.js";
import runUpsert from "../src/runUpsert.js";

test("生成待翻译任务列表", async () => {
  const update_set = new Set(["doc/zh/a.md", "doc/en/b.md"]),
    relations = new Map([
      [
        "doc",
        new Map([
          ["a.md", ["en"]],
          ["b.md", ["en"]],
          ["c.md", []],
        ]),
      ],
    ]),
    to_li = ["en", "ja"],
    cache_calls = [],
    update_cache = (prefix, rel, from_lang, to_lang) => {
      cache_calls.push([prefix, rel, from_lang, to_lang]);
    },
    upsert = () => {},
    runCache = runUpsert.bind(null, update_cache, "zh", upsert, () => {}),
    [to_tran_map, total] = await tranLiGen(runCache, update_set, "zh", to_li, relations);

  expect(to_tran_map).toEqual(
    new Map([
      [
        "doc",
        new Map([
          ["a.md", ["en", "ja"]],
          ["b.md", ["ja"]],
          ["c.md", ["en", "ja"]],
        ]),
      ],
    ]),
  );

  // a.md: 2 + b.md: 1 + c.md: 2 = 5
  expect(total).toBe(5);

  expect(cache_calls).toEqual([["doc", "b.md", "zh", "en"]]);
});
