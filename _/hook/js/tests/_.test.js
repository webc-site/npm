#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import rule from "../rule.js";

test("sleep 替换", async () => {
  const code = `
const run = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
};
  `,
    res = await rule(code);
  expect(res).toContain('import sleep from "@3-/sleep";');
  expect(res).toContain("sleep(100)");
});

test("sleep 替换且已有 import", async () => {
  const code = `
import sleep from "@3-/sleep";
const run = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
};
  `,
    res = await rule(code);
  // 不应该有重复的 import 语句
  const matches = res.match(/import sleep/g);
  expect(matches.length).toBe(1);
  expect(res).toContain("sleep(100)");
});

test("read 替换", async () => {
  const code = `
import { readFileSync } from "fs";
const data = readFileSync("a.txt", "utf8");
  `,
    res = await rule(code);
  expect(res).toContain('import read from "@3-/read";');
  expect(res).toContain('read("a.txt")');
  expect(res).not.toContain('import { readFileSync } from "fs";');
});

test("read 替换且已有 import", async () => {
  const code = `
import { readFileSync } from "fs";
import read from "@3-/read";
const data = readFileSync("a.txt", "utf8");
  `,
    res = await rule(code),
    matches = res.match(/import read/g);
  expect(matches.length).toBe(1);
  expect(res).toContain('read("a.txt")');
  expect(res).not.toContain("readFileSync");
});
