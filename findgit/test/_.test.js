#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import findgit from "../src/_.js";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const TMP_DIR = join(import.meta.dirname, "tmp_test_dir"),
  init = async () => {
    await mkdir(join(TMP_DIR, "a/b/c"), { recursive: true });
    await mkdir(join(TMP_DIR, ".git"), { recursive: true });
  },
  cleanup = () => rm(TMP_DIR, { recursive: true, force: true });

test("查找git目录", async () => {
  await init();
  try {
    [
      [join(TMP_DIR, "a/b/c"), TMP_DIR],
      ["/", "/"]
    ].forEach(([dir, val]) => expect(findgit(dir)).toBe(val));
  } finally {
    await cleanup();
  }
});
