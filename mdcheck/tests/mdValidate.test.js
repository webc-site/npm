import { test } from "bun:test";
import mdValidate from "../src/mdValidate.js";
import check from "./check.js";

const cases = [
  ["# Test 1\n\n```mermaid\nflowchart TD\n  A --> B\n```", true, []],
  ["# Test 2\n\n```mermaid\ngraph TD\n  A --> B\n  C & D E\n```", false, [6]],
  [
    "# Test 3\n\n```mermaid\nflowchart TD\n  A --> B\n```\n\n```mermaid\ngraph TD\n  A --> B\n  C & D E\n```",
    false,
    [11],
  ],
];

cases.forEach(([md, is_valid, err_lines], index) => {
  test("用例 " + index, async () => {
    check(await mdValidate(md), is_valid, err_lines);
  });
});
