#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import renderMd from "../src/_.js";

const DIR = import.meta.dirname,
  read = (name) => Bun.file(DIR + "/md/" + name).text();

test("成功", async () => {
  const mockUpload = async (buf, filename) => {
      expect(buf instanceof Uint8Array).toBe(true);
      expect(filename).toBe("a.svg");
      return "https://mock.github.com/releases/download/assets/mock.svg";
    },
    result = await renderMd(await read("ok.md"), mockUpload);
  expect(result).toContain("https://mock.github.com/releases/download/assets/mock.svg");
  expect(result).not.toContain("```mermaid");
});

test("失败", async () => {
  let err;
  try {
    await renderMd(await read("fail.md"), async () => "");
  } catch (e) {
    err = e;
  }
  expect(Array.isArray(err)).toBe(true);
  const [line, text, error] = err;
  expect(line).toBe(4);
  expect(text).toBe("this is completely invalid syntax {}");
  expect(error instanceof Error).toBe(true);
});
