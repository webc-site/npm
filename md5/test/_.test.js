#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import pathMd5 from "../src/pathMd5.js";

test("成功计算 md5", async () => {
  const content = "hello world",
    temp_path = join(tmpdir(), "test_md5_" + Math.random().toString(36).slice(2) + ".txt");

  await writeFile(temp_path, content);

  try {
    const expected = new Uint8Array(createHash("md5").update(content).digest()),
      result = await pathMd5(temp_path);
    expect(result).toEqual(expected);
  } finally {
    await unlink(temp_path).catch(() => {});
  }
});

test("文件不存在报错", async () => {
  const non_exist_path = join(tmpdir(), "non_exist_file_" + Math.random().toString(36).slice(2));
  expect(pathMd5(non_exist_path)).rejects.toThrow();
});
