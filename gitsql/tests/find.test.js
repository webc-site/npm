import { test, expect } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import find from "../src/find.js";

test("find 查找 gitsql.js 测试", async () => {
  const dir_path = join(import.meta.dirname, "find_test_dir"),
    sub_dir = join(dir_path, "sub");

  if (existsSync(dir_path)) {
    await rm(dir_path, { recursive: true, force: true });
  }

  await mkdir(dir_path, { recursive: true });
  await mkdir(sub_dir, { recursive: true });

  const file1 = join(dir_path, "gitsql.js"),
    file2 = join(sub_dir, "gitsql.js");

  // 情况 1: 子目录有文件，从子目录找，应返回子目录
  await writeFile(file2, "");
  expect(find(sub_dir, "gitsql.js")).toBe(sub_dir);

  // 情况 2: 子目录没有，父目录有，从子目录找，应返回父目录
  await rm(file2);
  await writeFile(file1, "");
  expect(find(sub_dir, "gitsql.js")).toBe(dir_path);

  // 情况 3: 都找不到，应返回 undefined
  await rm(file1);
  expect(find(sub_dir, "gitsql.js")).toBeUndefined();

  await rm(dir_path, { recursive: true });
});
