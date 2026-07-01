#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import minify from "../src/_.js";

// 创建临时测试目录，并在执行后清理
const tmp = async (prefix, onRun) => {
    const tmp_dir = await mkdtemp(join(tmpdir(), prefix)),
      js_path = join(tmp_dir, "test.js"),
      sub_dir = join(tmp_dir, "sub"),
      sub_js = join(sub_dir, "sub.js");
    await mkdir(sub_dir);
    await Promise.all(
      [
        [js_path, "const a = 1 + 2; console.log(a);"],
        [sub_js, "const b = 3 + 4; console.log(b);"],
      ].map(([path, content]) => writeFile(path, content)),
    );
    try {
      await onRun(tmp_dir);
    } finally {
      await rm(tmp_dir, { recursive: true, force: true });
    }
  },
  /* 校验输出内容 */
  check = (out) => expect(out.trim()).toMatch(/^\d+$/),
  /* 运行命令行工具 */
  cli = (args) =>
    spawnSync("bun", [join(import.meta.dirname, "../src/cli.js"), ...args], { encoding: "utf8" });

[
  ["压缩大小", "test_", async (tmp_dir) => check(String(await minify(tmp_dir)))],
  ["命令行运行", "cli_", (tmp_dir) => check(cli([tmp_dir]).stdout)],
].forEach(([desc, prefix, fn]) => test(desc, () => tmp("minify_size_" + prefix, fn)));

test("命令行缺参", () => expect(cli([]).status).not.toBe(0));
