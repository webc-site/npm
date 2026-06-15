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
  // 校验输出内容是否匹配期望的正则
  check = (out) =>
    [/test\.js.*\d+/, /sub\/sub\.js.*\d+/, /整体打包压缩后大小.*\d+/].forEach((reg) =>
      expect(out).toMatch(reg),
    ),
  // 运行命令行工具
  cli = (args) =>
    spawnSync("node", [join(import.meta.dirname, "../src/cli.js"), ...args], { encoding: "utf8" });

test("压缩并输出大小", () =>
  tmp("minify_size_test_", async (tmp_dir) => {
    const log = [],
      org_log = console.log;
    console.log = (...args) => log.push(args.join(" "));
    try {
      await minify(tmp_dir);
    } finally {
      console.log = org_log;
    }
    expect(log.length).toBe(1);
    check(log[0]);
  }));

test("CLI 运行正常", () =>
  tmp("minify_size_cli_", (tmp_dir) => {
    const { stdout } = cli([tmp_dir]);
    check(stdout);
  }));

test("CLI 缺少参数报错", () => {
  const { status } = cli([]);
  expect(status).not.toBe(0);
});
