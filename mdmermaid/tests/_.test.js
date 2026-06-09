#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import renderMd from "../src/_.js";

const DIR = import.meta.dirname,
  read = (name) => Bun.file(DIR + "/md/" + name).text();

test("成功", async () => {
  expect(await renderMd(await read("ok.md"))).toContain("<svg");
});

test("失败", async () => {
  let err;
  try {
    await renderMd(await read("fail.md"));
  } catch (e) {
    err = e;
  }
  expect(Array.isArray(err)).toBe(true);
  const [line, text, error] = err;
  expect(line).toBe(4);
  expect(text).toBe("this is completely invalid syntax {}");
  expect(error instanceof Error).toBe(true);
});
