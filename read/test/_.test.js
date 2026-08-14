#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import read from "../src/_.js";

test("读取文件", async () => {
  const file_path = join(import.meta.dirname, "tmp_test.txt"),
    content = "hello world " + Math.random();
  writeFileSync(file_path, content);
  try {
    const res = await read(file_path);
    expect(res).toBe(content);
  } finally {
    unlinkSync(file_path);
  }
});

test("读取不存在的文件报错", async () => {
  let err;
  try {
    await read("non_existent_file_123456.txt");
  } catch (e) {
    err = e;
  }
  expect(err.code).toBe("ENOENT");
});
