#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import renderMdt from "../src/_.js";

const CLI_PATH = join(import.meta.dirname, "../src/mdt.js"),
  withTmp = async (dir_name, cb) => {
    const pkg_path = join(import.meta.dirname, dir_name);
    await rm(pkg_path, { recursive: true, force: true });
    await mkdir(pkg_path, { recursive: true });
    try {
      await cb(
        pkg_path,
        (file, lines) => writeFile(join(pkg_path, file), lines.join("\n")),
        async (args) => {
          const proc = Bun.spawn([CLI_PATH, ...args], { cwd: pkg_path });
          await proc.exited;
        },
        (file) => existsSync(join(pkg_path, file)),
        (file) => rm(join(pkg_path, file), { recursive: true, force: true })
      );
    } finally {
      await rm(pkg_path, { recursive: true, force: true });
    }
  },
  runTest = (name, cb) => test(name, cb, { timeout: 30000 });

runTest("渲染", () =>
  withTmp("tmp_test_mdt", async (pkg_path, write) => {
    await write("sub.md", [
      "## Sub 1",
      "Some description for sub 1.",
      "### Sub Sub 1",
      "Some content.",
      "```",
      "# This is a comment inside code block, should not be a header",
      "```",
      "```js",
      "# This is a comment inside js code block, should not be a header",
      "```",
      "## Sub 2",
      "Some content."
    ]);

    await write("README.mdt", [
      "[English](#en) | [中文](#zh)",
      "",
      "---",
      "",
      '<a id="en"></a>',
      "# Test Project",
      "<+ ./sub.md >",
      "",
      "---",
      "",
      '<a id="zh"></a>',
      "# 测试项目",
      "## 1. 简介",
      "这里是简介。"
    ]);

    const blocks = (await renderMdt(join(pkg_path, "README.mdt"), pkg_path)).split("\n---\n");

    expect(blocks.length).toBe(3);
    expect(blocks[0]).not.toContain("- [");

    [
      "# Test Project",
      "- [Test Project](#test-project)",
      "  - [Sub 1](#sub-1)",
      "    - [Sub Sub 1](#sub-sub-1)",
      "  - [Sub 2](#sub-2)"
    ].forEach((val) => expect(blocks[1]).toContain(val));

    ["comment-inside-code-block", "comment-inside-js-code-block"].forEach((val) =>
      expect(blocks[1]).not.toContain(val)
    );

    ["# 测试项目", "- [测试项目](#测试项目)", "  - [1. 简介](#1-简介)"].forEach((val) =>
      expect(blocks[2]).toContain(val)
    );
  })
);

runTest("CLI 渲染", () =>
  withTmp("tmp_test_cli", async (pkg_path, write, run, exists, rm_file) => {
    await write("sub.md", ["## Sub 1", "Content"]);
    await write("README.mdt", ["# Test CLI", "<+ ./sub.md >"]);

    for (const args of [[], ["README.mdt"]]) {
      await rm_file("README.md");
      await run(args);
      expect(exists("README.md")).toBe(true);
    }
  })
);

runTest("MISS 警告", () =>
  withTmp("tmp_test_miss", async (pkg_path, write) => {
    const warn_msgs = [],
      original_warn = console.warn;
    console.warn = (...args) => warn_msgs.push(args.join(" "));
    try {
      await write("README.mdt", ["# Test MISS", "<+ ./nonexistent.md >"]);
      await renderMdt(join(pkg_path, "README.mdt"), pkg_path);
      const warn_msg = warn_msgs.join(" ");
      ["MISS", "nonexistent.md", "README.mdt"].forEach((val) => expect(warn_msg).toContain(val));
    } finally {
      console.warn = original_warn;
    }
  })
);
