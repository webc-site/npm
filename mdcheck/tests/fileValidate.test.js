import { test } from "bun:test";
import { join } from "node:path";
import fileValidate from "../src/fileValidate.js";
import check from "./check.js";

const dir = import.meta.dirname,
  cases = [
    ["valid.md", true, []],
    ["invalid.md", false, [9]],
    ["multiple.md", false, [15]],
    ["no_mermaid.md", true, []],
  ];

cases.forEach(([filename, is_valid, err_lines]) => {
  test(filename, async () => {
    check(await fileValidate(join(dir, "md", filename)), is_valid, err_lines);
  });
});
