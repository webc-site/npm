#!/usr/bin/env -S bun test
import { describe } from "bun:test";
import path from "node:path";
import { runCases } from "./helper.js";

const TEST_DIR = path.resolve(import.meta.dirname, "temp_nesting_keep_tests"),
  cases = [
    {
      name: "保留基础类嵌套",
      files: {
        "nest.styl": ".parent\n  color red\n  .child\n    color blue\n",
      },
      entry: "nest.styl",
      includes: [".parent {\n  color: red;\n  .child {\n    color: blue;\n  }\n}"],
      excludes: [".parent .child"],
    },
    {
      name: "保留伪类状态拼接嵌套",
      files: {
        "nest.styl": ".btn\n  padding 10px\n  &:hover\n    color red\n  &.active\n    color blue\n",
      },
      entry: "nest.styl",
      includes: [
        ".btn {\n  padding: 10px;\n  &:hover {\n    color: red;\n  }\n\n  &.active {\n    color: blue;\n  }\n}",
      ],
    },
    {
      name: "保留嵌套媒体查询",
      files: {
        "nest.styl": ".container\n  width 100%\n  @media (max-width: 600px)\n    width 50%\n",
      },
      entry: "nest.styl",
      includes: [
        ".container {\n  width: 100%;\n  @media (max-width: 600px) {\n    width: 50%;\n  }\n}",
      ],
    },
  ];

describe("CSS 嵌套保留测试", () => {
  runCases(cases, TEST_DIR);
});
