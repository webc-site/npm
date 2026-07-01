#!/usr/bin/env -S bun test
import { describe } from "bun:test";
import path from "node:path";
import { runCases } from "./helper.js";

const TEST_DIR = path.resolve(import.meta.dirname, "temp_external_tests"),
  cases = [
    {
      name: "外置引用的打包逻辑",
      files: {
        "var.styl": "bg_color = #f00\n",
        "theme.styl": "body\n  background bg_color\n",
        "comp_a/_.styl": "text_color = #000\n.comp-a\n  color text_color\n",
        "main.styl":
          '@import "./var.styl"\n@import "./theme.styl"\n@import "./comp_a/_.styl"\n.main\n  color text_color\n',
      },
      entry: "main.styl",
      compileArgs: [false, true],
      includes: [
        '@import "./var.css";',
        '@import "./theme.css";',
        '@import "./comp_a/_.css";',
        ".main {\n  color: #000;\n}",
      ],
      excludes: ["body", ".comp-a"],
    },
  ];

describe("外部引入测试", () => {
  runCases(cases, TEST_DIR);
});
