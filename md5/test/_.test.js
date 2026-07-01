#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import fmt from "@1-/fmt";
import utf8e from "@3-/utf8/utf8e.js";
import pathMd5 from "../src/pathMd5.js";
import fmtMd5 from "../src/fmtMd5.js";

const md5 = (data) => createHash("md5").update(data).digest(),
  tmpFp = (ext) => join(tmpdir(), Math.random().toString(36).slice(2) + (ext ? "." + ext : ""));

test("计算 md5", async () => {
  const content = "hello world  \r\n",
    formatted = await fmt(content),
    cases = [
      ["txt", md5(utf8e(formatted))],
      ["bin", md5(content)],
    ];

  await Promise.all(
    cases.map(async ([ext, expected]) => {
      const fp = tmpFp(ext);
      await writeFile(fp, content);
      try {
        expect(await pathMd5(fp)).toEqual(expected);
      } finally {
        await unlink(fp).catch(() => {});
      }
    }),
  );
});

test("fmtMd5 计算", async () => {
  const content = " hello \r\nworld  ",
    expected = md5(utf8e(await fmt(content)));
  expect(await fmtMd5(content)).toEqual(expected);
});

test("文件不存在报错", async () => {
  expect(pathMd5(tmpFp())).rejects.toThrow();
});
