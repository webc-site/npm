#!/usr/bin/env -S bun test

import read from "@1-/read";
import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import renderMdt from "../src/_.js";

const CLI_PATH = join(import.meta.dirname, "../src/mdt.js"),
  /*
  按序校验字符串片段是否在目标文本中依次出现
  content: 目标文本
  snippet_li: 片段数组
  */
  assertOrder = (content, snippet_li) => {
    let prev = -1;
    snippet_li.forEach((item) => {
      const idx = content.indexOf(item);
      expect(idx).toBeGreaterThan(prev);
      prev = idx;
    });
  },
  /*
  批量校验文本包含与排除规则
  content: 目标文本
  has_li: 必须包含的字符串数组
  has_not_li: 不能包含的字符串数组
  */
  assertInclude = (content, has_li = [], has_not_li = []) => {
    has_li.forEach((val) => expect(content).toContain(val));
    has_not_li.forEach((val) => expect(content).not.toContain(val));
  },
  /*
  捕获函数执行期间的 WARN 日志
  func: 异步执行函数
  返回值: 拼接后的日志字符串
  */
  captureWarn = async (func) => {
    const warn_li = [],
      original_warn = console.warn;
    console.warn = (...args) => warn_li.push(args.join(" "));
    try {
      await func();
    } finally {
      console.warn = original_warn;
    }
    return warn_li.join(" ");
  },
  /*
  创建临时沙箱目录并注入测试工具函数
  cb: 测试回调 (pkg_path, write, run, exists, read)
  */
  withTmp = async (cb) => {
    const pkg_path = join(import.meta.dirname, "tmp_" + Math.random().toString(36).slice(2));
    await rm(pkg_path, { recursive: true, force: true });
    await mkdir(pkg_path, { recursive: true });
    try {
      await cb(
        pkg_path,
        (...entries) =>
          Promise.all(
            entries.map(async ([file, lines]) => {
              const full_path = join(pkg_path, file);
              await mkdir(dirname(full_path), { recursive: true });
              await writeFile(full_path, lines.join("\n"));
            })
          ),
        async (args) => {
          const proc = Bun.spawn([CLI_PATH, ...args], { cwd: pkg_path });
          await proc.exited;
        },
        (file) => existsSync(join(pkg_path, file)),
        (file) => read(join(pkg_path, file))
      );
    } finally {
      await rm(pkg_path, { recursive: true, force: true });
    }
  };

test("演示与多语言分块渲染", () =>
  withTmp(async (pkg_path, write) => {
    await write(
      [
        "readme/en.md",
        [
          "# Test Project",
          "[![Badge](https://img.shields.io)](https://example.com)",
          "> A fast and simple tool.",
          "",
          "Description paragraph 1.",
          "",
          "Description paragraph 2.",
          "",
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
        ]
      ],
      [
        "readme/zh.md",
        [
          "# 测试项目",
          "这里是中文项目简介第一段。",
          "",
          "这里是中文项目简介第二段。",
          "",
          "## 1. 简介",
          "这里是简介内容。",
          "## 2. 安装",
          "这里是安装说明。"
        ]
      ],
      [
        "README.mdt",
        [
          "[English](#en) | [中文](#zh)",
          "",
          "---",
          "",
          '<a id="en"></a>',
          "<+ ./readme/en.md >",
          "",
          "---",
          "",
          '<a id="zh"></a>',
          "<+ ./readme/zh.md >"
        ]
      ]
    );

    const block_li = (await renderMdt(join(pkg_path, "README.mdt"), pkg_path)).split("\n---\n");

    expect(block_li.length).toBe(3);

    [
      [block_li[0], ["[English](#en) | [中文](#zh)"], ["- ["]],
      [
        block_li[1],
        ["- [Sub 1](#sub-1)", "  - [Sub Sub 1](#sub-sub-1)", "- [Sub 2](#sub-2)"],
        [
          "- [Test Project](#test-project)",
          "comment-inside-code-block",
          "comment-inside-js-code-block"
        ]
      ],
      [block_li[2], ["- [1. 简介](#1-简介)", "- [2. 安装](#2-安装)"], ["- [测试项目](#测试项目)"]]
    ].forEach(([block, has_li, has_not_li]) => assertInclude(block, has_li, has_not_li));

    [
      [
        block_li[1],
        [
          "# Test Project",
          "[![Badge]",
          "> A fast and simple tool.",
          "Description paragraph 1.",
          "Description paragraph 2.",
          "- [Sub 1](#sub-1)",
          "## Sub 1"
        ]
      ],
      [
        block_li[2],
        [
          "# 测试项目",
          "这里是中文项目简介第一段。",
          "这里是中文项目简介第二段。",
          "- [1. 简介](#1-简介)",
          "## 1. 简介"
        ]
      ]
    ].forEach(([block, order_li]) => assertOrder(block, order_li));
  }));

test("项目 README 真实渲染", async () => {
  const rendered = await renderMdt(join(import.meta.dirname, "../README.mdt"));
  assertInclude(rendered, [
    "[English](#en) | [中文](#zh)",
    '<a id="en"></a>',
    "- [1. Features](#1-features)",
    "- [2. Usage Demonstration](#2-usage-demonstration)",
    '<a id="zh"></a>',
    "- [1. 功能介绍](#1-功能介绍)",
    "- [2. 使用演示](#2-使用演示)"
  ]);
  assertOrder(rendered, [
    "[English](#en) | [中文](#zh)",
    '<a id="en"></a>',
    "- [1. Features](#1-features)",
    "## 1. Features",
    '<a id="zh"></a>',
    "- [1. 功能介绍](#1-功能介绍)",
    "## 1. 功能介绍"
  ]);
});

[
  ["默认参数", [], "README.mdt", "README.md"],
  ["指定文件", ["README.mdt"], "README.mdt", "README.md"],
  ["指定目录", ["./docs"], "docs/README.mdt", "docs/README.md"]
].forEach(([desc, args, src_file, out_file]) => {
  test("CLI " + desc, () =>
    withTmp(async (pkg_path, write, run, exists, read) => {
      await write(
        [src_file, ["# 标题", "说明段落", "<+ ./sub.md >"]],
        [join(dirname(src_file), "sub.md"), ["## 子章节", "内容"]]
      );
      await run(args);
      expect(exists(out_file)).toBe(true);
      const content = await read(out_file);
      assertInclude(content, ["# 标题", "- [子章节](#子章节)", "## 子章节", "内容"]);
    })
  );
});

test("多层嵌套导入", () =>
  withTmp(async (pkg_path, write) => {
    await write(
      ["README.mdt", ["# 根文档", "<+ ./sub1.md >"]],
      ["sub1.md", ["## 一级嵌套", "<+ ./sub2.md >"]],
      ["sub2.md", ["### 二级嵌套", "最终内容"]]
    );
    const content = await renderMdt(join(pkg_path, "README.mdt"), pkg_path);
    assertInclude(content, [
      "# 根文档",
      "- [一级嵌套](#一级嵌套)",
      "  - [二级嵌套](#二级嵌套)",
      "## 一级嵌套",
      "### 二级嵌套",
      "最终内容"
    ]);
    assertOrder(content, [
      "# 根文档",
      "- [一级嵌套](#一级嵌套)",
      "## 一级嵌套",
      "### 二级嵌套",
      "最终内容"
    ]);
  }));

test("缺失文件警告与容错", () =>
  withTmp(async (pkg_path, write) => {
    await write(["README.mdt", ["# 标题", "正常内容", "<+ ./missing.md >"]]);
    let content;
    const warn_msg = await captureWarn(async () => {
      content = await renderMdt(join(pkg_path, "README.mdt"), pkg_path);
    });
    assertInclude(warn_msg, ["MISS", "missing.md", "README.mdt"]);
    assertInclude(content, ["# 标题", "正常内容"]);
  }));

test("无二级标题不生成目录", () =>
  withTmp(async (pkg_path, write) => {
    await write(["README.mdt", ["# 仅一级标题", "段落一", "段落二"]]);
    const content = await renderMdt(join(pkg_path, "README.mdt"), pkg_path);
    assertInclude(content, ["# 仅一级标题", "段落一", "段落二"], ["- ["]);
  }));
