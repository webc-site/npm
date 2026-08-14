#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import importLi from "../src/importLi.js";
import exportLi from "../src/exportLi.js";

const DIR = import.meta.dirname;

test("解析导入", () => {
  const code =
      'import a from "a-module";\n' +
      'import { b } from "b-module";\n' +
      'export { c } from "c-module";\n' +
      'export * from "d-module";\n' +
      'import("e-module");\n' +
      "import(`f-module`);\n" +
      "import(`g-module-${x}`);",
    [static_li, dynamic_li, template_li] = importLi(code);
  expect(static_li).toEqual(["a-module", "b-module", "c-module", "d-module"]);
  expect(dynamic_li).toEqual(["e-module", "f-module"]);
  expect(template_li).toEqual([["g-module-", ""]]);
});

test("解析导出", () => {
  const test_cases = [
    [join(DIR, "../src/importLi.js"), ["default"]],
    [join(DIR, "../src/not_exist.js"), undefined],
    [
      "export default 123;\n" +
        "export const a = 1, [b, c] = x;\n" +
        "export const { d, e: f } = y;\n" +
        "export function func() {}\n" +
        "export class Cls {}\n" +
        "export { u, v as w };\n" +
        "export * as ns from 'mod';\n" +
        "export * from 'mod2';",
      ["default", "a", "b", "c", "d", "f", "func", "Cls", "u", "w", "ns"]
    ]
  ];

  test_cases.forEach(([file_or_code, expected]) => {
    if (file_or_code.startsWith("export ")) {
      const tmp_file = join(DIR, "./tmp_test_export.js");
      writeFileSync(tmp_file, file_or_code);
      try {
        expect(exportLi(tmp_file)).toEqual(expected);
      } finally {
        rmSync(tmp_file);
      }
    } else {
      expect(exportLi(file_or_code)).toEqual(expected);
    }
  });
});
