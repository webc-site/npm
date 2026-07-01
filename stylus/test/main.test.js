#!/usr/bin/env -S bun test
import { describe, expect } from "bun:test";
import path from "node:path";
import { ERR_NOT_FOUND } from "../src/ERR.js";
import { runCases } from "./helper.js";

const TEST_DIR = path.resolve(import.meta.dirname, "temp_main_tests"),
  cases = [
    {
      name: "编译嵌套规则和变量",
      files: {
        "nested.styl":
          "base_color = #f00\nbody\n  background base_color\n  h1\n    color #000\n  th:last-child\n    border-right none\n  c-md:hover\n    opacity 0.8\n  align-items flex-start\n  --custom-prop value\n",
      },
      entry: "nested.styl",
      includes: [
        "body {\n  background: #f00;\n  align-items: flex-start;\n  --custom-prop: value;",
        "  h1 {\n    color: #000;\n  }",
        "  th:last-child {\n    border-right: none;\n  }",
        "  c-md:hover {\n    opacity: 0.8;\n  }",
      ],
    },
    {
      name: "编译普通引入并解析变量",
      files: {
        "dep.styl": "border_val = 1px solid #ccc\n.card\n  border border_val\n",
        "normal.styl": '@import "dep"\ndiv\n  display flex\n',
      },
      entry: "normal.styl",
      includes: [".card {\n  border: 1px solid #ccc;\n}", "div {\n  display: flex;\n}"],
    },
    {
      name: "处理循环引入并打破循环",
      files: {
        "circular_a.styl": '@import "circular_b"\nbody\n  margin 0\n',
        "circular_b.styl": '@import "circular_a"\nh1\n  padding 10px\n',
      },
      entry: "circular_a.styl",
      includes: ["h1 {\n  padding: 10px;\n}", "body {\n  margin: 0;\n}"],
    },
    {
      name: "处理缺失引入并抛出ERR_NOT_FOUND",
      files: {
        "missing_import.styl": '@import "non_existent"\nbody\n  color #fff\n',
      },
      entry: "missing_import.styl",
      error: [ERR_NOT_FOUND, "non_existent.styl"],
    },
    {
      name: "正常编译重复引入(DAG)",
      files: {
        "dag_main.styl": '@import "dag_b"\n@import "dag_c"\nbody\n  background #000\n',
        "dag_b.styl": '@import "dag_c"\ndiv\n  color #fff\n',
        "dag_c.styl": "h1\n  margin 0\n",
      },
      entry: "dag_main.styl",
      includes: [
        "h1 {\n  margin: 0;\n}",
        "div {\n  color: #fff;\n}",
        "body {\n  background: #000;\n}",
      ],
      assert: (css) => {
        const h1_count = (css.match(/h1\s*\{/g) || []).length;
        expect(h1_count).toBe(1);
      },
    },
    {
      name: "处理require循环引入并打破循环",
      files: {
        "req_circular_a.styl": '@require "req_circular_b"\nbody\n  margin 0\n',
        "req_circular_b.styl": '@require "req_circular_a"\nh1\n  padding 10px\n',
      },
      entry: "req_circular_a.styl",
      includes: ["h1 {\n  padding: 10px;\n}", "body {\n  margin: 0;\n}"],
    },
    {
      name: "正常编译重复require(DAG)",
      files: {
        "req_dag_main.styl":
          '@require "req_dag_b"\n@require "req_dag_c"\nbody\n  background #000\n',
        "req_dag_b.styl": '@require "req_dag_c"\ndiv\n  color #fff\n',
        "req_dag_c.styl": "h1\n  margin 0\n",
      },
      entry: "req_dag_main.styl",
      includes: [
        "h1 {\n  margin: 0;\n}",
        "div {\n  color: #fff;\n}",
        "body {\n  background: #000;\n}",
      ],
      assert: (css) => {
        const h1_count = (css.match(/h1\s*\{/g) || []).length;
        expect(h1_count).toBe(1);
      },
    },
    {
      name: "正确处理未加引号的URL和注释",
      files: {
        "comment_url.styl":
          "body\n  background url(http://example.com/logo.png)\n  background-image url(//example.com/logo.png)\n  color #fff // white color\n  /* multi\n     line */\n  margin 0\n",
      },
      entry: "comment_url.styl",
      includes: [
        "background: url(http://example.com/logo.png);",
        "background-image: url(//example.com/logo.png);",
        "color: #fff;",
        "margin: 0;",
      ],
    },
  ];

describe("stylus 编译器测试", () => {
  runCases(cases, TEST_DIR);
});
