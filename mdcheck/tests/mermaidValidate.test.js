import { test } from "bun:test";
import mermaidValidate from "../src/mermaidValidate.js";
import check from "./check.js";

const cases = [
  ["flowchart TD\n  A --> B", true, []],
  ["graph TD\n  A --> B\n  C & D E", false, [3]],
];

cases.forEach(([code, is_valid, err_lines], index) => {
  test("用例 " + index, async () => {
    check(await mermaidValidate(code), is_valid, err_lines);
  });
});
