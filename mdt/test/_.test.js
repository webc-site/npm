#!/usr/bin/env -S bun test

import read from "@1-/read";
import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import renderMdt from "../src/_.js";

const CLI_PATH = join(import.meta.dirname, "../src/mdt.js"),
  /*
  校验文本片段依次出现
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
  校验包含与排除文本
  content: 目标文本
  has_li: 必须包含的片段
  not_li: 不能包含的片段
  */
  assertInclude = (content, has_li = [], not_li = []) => {
    has_li.forEach((val) => expect(content).toContain(val));
    not_li.forEach((val) => expect(content).not.toContain(val));
  },
  /*
  捕获执行期间的 WARN 日志
  func: 异步执行函数
  返回值: 拼接后的日志
  */
  captureWarn = async (func) => {
    const warn_li = [],
      warn = console.warn;
    console.warn = (...args) => warn_li.push(args.join(" "));
    try {
      await func();
    } finally {
      console.warn = warn;
    }
    return warn_li.join(" ");
  },
  /*
  创建临时沙箱运行回调
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
              const full = join(pkg_path, file);
              await mkdir(dirname(full), { recursive: true });
              await writeFile(full, lines.join("\n"));
            })
          ),
        (args) => Bun.spawn([CLI_PATH, ...args], { cwd: pkg_path }).exited,
        (file) => existsSync(join(pkg_path, file)),
        (file) => read(join(pkg_path, file))
      );
    } finally {
      await rm(pkg_path, { recursive: true, force: true });
    }
  },
  /*
  临时沙箱写入文件并渲染 mdt
  entries: 文件条目数组 [相对路径, 行数组]
  返回值: [渲染结果, 警告日志]
  */
  renderTmp = async (...entries) => {
    let content, warn_msg;
    await withTmp(async (pkg_path, write) => {
      await write(...entries);
      warn_msg = await captureWarn(async () => {
        content = await renderMdt(join(pkg_path, "README.mdt"), pkg_path);
      });
    });
    return [content, warn_msg];
  };

test("演示与多语言分块渲染", async () => {
  const [content] = await renderTmp(
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
    ),
    block_li = content.split("\n---\n");

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
      ],
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
      ["- [1. 简介](#1-简介)", "- [2. 安装](#2-安装)"],
      ["- [测试项目](#测试项目)"],
      [
        "# 测试项目",
        "这里是中文项目简介第一段。",
        "这里是中文项目简介第二段。",
        "- [1. 简介](#1-简介)",
        "## 1. 简介"
      ]
    ]
  ].forEach(([block, has_li, not_li, order_li]) => {
    assertInclude(block, has_li, not_li);
    if (order_li) assertOrder(block, order_li);
  });
});

test("项目 README 渲染", async () => {
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
].forEach(([desc, args, src, out]) => {
  test("CLI " + desc, () =>
    withTmp(async (pkg_path, write, run, exists, read) => {
      await write(
        [src, ["# 标题", "说明段落", "<+ ./sub.md >"]],
        [join(dirname(src), "sub.md"), ["## 子章节", "内容"]]
      );
      await run(args);
      expect(exists(out)).toBe(true);
      assertInclude(await read(out), ["# 标题", "- [子章节](#子章节)", "## 子章节", "内容"]);
    })
  );
});

[
  [
    "多层嵌套导入与目录生成",
    [
      ["README.mdt", ["# 根文档", "<+ ./sub1.md >"]],
      ["sub1.md", ["## 一级嵌套", "<+ ./sub2.md >"]],
      ["sub2.md", ["### 二级嵌套", "最终内容"]]
    ],
    [
      "# 根文档",
      "- [一级嵌套](#一级嵌套)",
      "  - [二级嵌套](#二级嵌套)",
      "## 一级嵌套",
      "### 二级嵌套",
      "最终内容"
    ],
    [],
    ["# 根文档", "- [一级嵌套](#一级嵌套)", "## 一级嵌套", "### 二级嵌套", "最终内容"]
  ],
  [
    "无二级标题不生成目录",
    [["README.mdt", ["# 仅一级标题", "段落一", "段落二"]]],
    ["# 仅一级标题", "段落一", "段落二"],
    ["- ["]
  ],
  [
    "相对路径多级包含",
    [
      ["README.mdt", ["# 根文档", "<+ ./dir_a/a.md >"]],
      ["dir_a/a.md", ["## 目录A内容", "<+ ./dir_b/b.md >"]],
      ["dir_a/dir_b/b.md", ["### 目录B内容", "最终叶子节点"]]
    ],
    ["# 根文档", "## 目录A内容", "### 目录B内容", "最终叶子节点"]
  ],
  [
    "多处引用公共文件",
    [
      ["README.mdt", ["# 根文档", "<+ ./part1.md >", "<+ ./part2.md >"]],
      ["part1.md", ["## 第一部分", "<+ ./common.md >"]],
      ["part2.md", ["## 第二部分", "<+ ./common.md >"]],
      ["common.md", ["公共内容"]]
    ],
    ["# 根文档", "## 第一部分", "## 第二部分"],
    [],
    null,
    [["公共内容", 2]]
  ]
].forEach(([desc, entries, has_li, not_li, order_li, count_li = []]) => {
  test(desc, async () => {
    const [content] = await renderTmp(...entries);
    assertInclude(content, has_li, not_li);
    if (order_li) assertOrder(content, order_li);
    count_li.forEach(([str, num]) => expect(content.split(str).length - 1).toBe(num));
  });
});

[
  [
    "文件缺失",
    [["README.mdt", ["# 标题", "正常内容", "<+ ./missing.md >"]]],
    ["MISS", "missing.md", "README.mdt"],
    ["# 标题", "正常内容"]
  ],
  [
    "间接循环包含",
    [
      ["README.mdt", ["# 根文档", "<+ ./loop_a.md >"]],
      ["loop_a.md", ["## Loop A", "<+ ./loop_b.md >"]],
      ["loop_b.md", ["### Loop B", "<+ ./loop_a.md >"]]
    ],
    ["CIRCULAR", "loop_a.md"],
    ["# 根文档"]
  ],
  [
    "直接自引用死循环",
    [["README.mdt", ["# 根文档", "<+ ./README.mdt >"]]],
    ["CIRCULAR", "README.mdt"],
    ["# 根文档"]
  ]
].forEach(([desc, entries, warn_li, has_li]) => {
  test("异常警告: " + desc, async () => {
    const [content, warn_msg] = await renderTmp(...entries);
    assertInclude(warn_msg, warn_li);
    assertInclude(content, has_li);
  });
});
