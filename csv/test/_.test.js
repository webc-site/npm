#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import csvD from "../src/csvD.js";
import csvE from "../src/csvE.js";
import loads from "../src/loads.js";
import dumps from "../src/dumps.js";
import load from "../src/load.js";
import dump from "../src/dump.js";

const CASES = [
    ["a", "b", "c"],
    ["a", "b\nc", "d"],
    ["a", "", "b"],
    ["", ""],
    ["a", "b;c", "d"],
    ["a", "b,c", "d"],
    ['a\nb,c"d\r\ne', ""],
    [""],
    ["", "", ""],
  ],
  CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,;"\n\r \t',
  randStr = () =>
    Array.from(
      { length: Math.floor(Math.random() * 20) },
      () => CHARS[Math.floor(Math.random() * CHARS.length)],
    ).join(""),
  randRow = (cols) => Array.from({ length: cols }, randStr),
  randMatrix = (rows, cols) => Array.from({ length: rows }, () => randRow(cols));

test("基础编解码一致", () => {
  CASES.forEach((data) => {
    expect(csvD(csvE(data))).toEqual(data);
  });
});

test("解码换行符", () => {
  const expected = ["a", "b"];
  ["a,b\nc,d\n", "a,b\rc,d\r", "a,b\r\nc,d\r\n"].forEach((s) => {
    expect(csvD(s)).toEqual(expected);
  });
});

test("空输入", () => {
  expect(csvD("")).toEqual([]);
});

test("容错解码", () => {
  [
    ['"abc', ["abc"]],
    ['a,"b', ["a", "b"]],
    ['"a"b,c', ["a", "b", "c"]],
    ['a"b,c', ['a"b', "c"]],
  ].forEach(([input, expected]) => {
    expect(csvD(input)).toEqual(expected);
  });
});

test("编码非字符", () => {
  const data = [null, undefined, 123, true, 0],
    expected = ["", "", "123", "true", "0"];
  expect(csvD(csvE(data))).toEqual(expected);
});

test("随机单行回环", () => {
  Array.from({ length: 200 }).forEach(() => {
    const data = randRow(Math.floor(Math.random() * 10) + 1);
    expect(csvD(csvE(data))).toEqual(data);
  });
});

test("多行编解码一致", () => {
  expect(loads(dumps(CASES))).toEqual(CASES);
});

test("文件读写一致", async () => {
  const tmp_file = join(import.meta.dirname, "tmp_test.csv");
  try {
    await dump(tmp_file, CASES);
    const data = await load(tmp_file);
    expect(data).toEqual(CASES);
  } finally {
    try {
      await rm(tmp_file);
    } catch {}
  }
});

test("随机多行回环", () => {
  Array.from({ length: 50 }).forEach(() => {
    const rows = Math.floor(Math.random() * 10) + 1,
      cols = Math.floor(Math.random() * 5) + 1,
      data = randMatrix(rows, cols);
    expect(loads(dumps(data))).toEqual(data);
  });
});
