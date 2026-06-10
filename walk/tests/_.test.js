#!/usr/bin/env -S bun test
import sleep from "@3-/sleep";
import { test, expect } from "bun:test";
import walk, { DIR, FILE } from "../src/_.js";
import walkRel from "../src/walkRel.js";
import walkRelIgnore from "../src/walkRelIgnore.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

const TMP_DIR = join(import.meta.dirname, "tmp_test_dir"),
  init = async () => {
    await mkdir(TMP_DIR, { recursive: true });
    await Promise.all(["a", "b"].map((d) => mkdir(join(TMP_DIR, d))));
    await Promise.all(
      [
        [join("a", "file1.txt"), "hello"],
        [join("b", "file2.txt"), "world"],
        ["file3.txt", "rootfile"],
      ].map(([p, val]) => writeFile(join(TMP_DIR, p), val)),
    );
  },
  cleanup = () => rm(TMP_DIR, { recursive: true, force: true });

test("walk", async () => {
  await init();

  const visited = [];
  await walk(TMP_DIR, async (kind, path) => {
    visited.push([kind, path.replace(TMP_DIR, "")]);
  });

  [
    [DIR, "/a"],
    [DIR, "/b"],
    [FILE, "/file3.txt"],
    [FILE, "/a/file1.txt"],
    [FILE, "/b/file2.txt"],
  ].forEach((item) => expect(visited).toContainEqual(item));

  const visited_skipped = [];
  await walk(TMP_DIR, async (kind, path) => {
    const rel = path.replace(TMP_DIR, "");
    visited_skipped.push([kind, rel]);
    if (rel === "/a") {
      return false;
    }
  });

  [
    [DIR, "/a"],
    [DIR, "/b"],
    [FILE, "/b/file2.txt"],
  ].forEach((item) => expect(visited_skipped).toContainEqual(item));
  expect(visited_skipped).not.toContainEqual([FILE, "/a/file1.txt"]);

  // 并发限制测试
  let active = 0,
    max_active = 0;
  await walk(
    TMP_DIR,
    async () => {
      active++;
      max_active = Math.max(max_active, active);
      await sleep(5);
      active--;
    },
    1,
  );
  expect(max_active).toBe(1);

  await cleanup();
});

test("walkRel", async () => {
  await init();

  const visited = [];
  await walkRel(TMP_DIR, async (kind, rel_path) => {
    visited.push([kind, rel_path]);
  });

  [
    [DIR, "a"],
    [DIR, "b"],
    [FILE, "file3.txt"],
    [FILE, "a/file1.txt"],
    [FILE, "b/file2.txt"],
  ].forEach((item) => expect(visited).toContainEqual(item));

  // 测试带斜杠结尾的目录路径
  const visited_with_slash = [];
  await walkRel(TMP_DIR + "/", async (kind, rel_path) => {
    visited_with_slash.push([kind, rel_path]);
  });
  [
    [DIR, "a"],
    [DIR, "b"],
    [FILE, "file3.txt"],
    [FILE, "a/file1.txt"],
    [FILE, "b/file2.txt"],
  ].forEach((item) => expect(visited_with_slash).toContainEqual(item));

  const visited_skipped = [];
  await walkRel(TMP_DIR, async (kind, rel_path) => {
    visited_skipped.push([kind, rel_path]);
    if (rel_path === "a") {
      return false;
    }
  });

  [
    [DIR, "a"],
    [DIR, "b"],
    [FILE, "b/file2.txt"],
  ].forEach((item) => expect(visited_skipped).toContainEqual(item));
  expect(visited_skipped).not.toContainEqual([FILE, "a/file1.txt"]);

  // 并发限制测试
  let active = 0,
    max_active = 0;
  await walkRel(
    TMP_DIR,
    async () => {
      active++;
      max_active = Math.max(max_active, active);
      await sleep(5);
      active--;
    },
    1,
  );
  expect(max_active).toBe(1);

  await cleanup();
});

test("walkRelIgnore", async () => {
  await mkdir(TMP_DIR, { recursive: true });
  await Promise.all(
    ["a", "node_modules", ".git"].map((d) => mkdir(join(TMP_DIR, d), { recursive: true })),
  );
  await Promise.all(
    [
      [join("a", "file1.txt"), "hello"],
      [join("node_modules", "file2.txt"), "world"],
      [join(".git", "config"), "config"],
      [".dotfile", "dot"],
      ["file3.txt", "rootfile"],
    ].map(([p, val]) => writeFile(join(TMP_DIR, p), val)),
  );

  const visited = [];
  await walkRelIgnore(TMP_DIR, async (kind, rel_path) => {
    visited.push([kind, rel_path]);
  });

  const expected = [
    [DIR, "a"],
    [FILE, "a/file1.txt"],
    [FILE, "file3.txt"],
  ];
  expect(visited.length).toBe(expected.length);
  expected.forEach((item) => expect(visited).toContainEqual(item));

  await cleanup();
});
