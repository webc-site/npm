#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import rule from "../rule.js";

const TESTS = [
  [
    "sleep 替换",
    "const run = async () => {\n" +
      "  await new Promise(resolve => setTimeout(resolve, 100));\n" +
      "};",
    res => {
      expect(res).toContain('import sleep from "@3-/sleep";');
      expect(res).toContain("sleep(100)");
    }
  ],
  [
    "sleep 替换且已有 import",
    'import sleep from "@3-/sleep";\n' +
      "const run = async () => {\n" +
      "  await new Promise(resolve => setTimeout(resolve, 100));\n" +
      "};",
    res => {
      expect(res.match(/import sleep/g).length).toBe(1);
      expect(res).toContain("sleep(100)");
    }
  ],
  [
    "read 替换",
    'import { readFileSync } from "fs";\n' +
      'const data = readFileSync("a.txt", "utf8");',
    res => {
      expect(res).toContain('import read from "@3-/read";');
      expect(res).toContain('read("a.txt")');
      expect(res).not.toContain('import { readFileSync } from "fs";');
    }
  ],
  [
    "read 替换且已有 import",
    'import { readFileSync } from "fs";\n' +
      'import read from "@3-/read";\n' +
      'const data = readFileSync("a.txt", "utf8");',
    res => {
      expect(res.match(/import read/g).length).toBe(1);
      expect(res).toContain('read("a.txt")');
      expect(res).not.toContain("readFileSync");
    }
  ],
  [
    "while 替换",
    "const run = () => {\n" +
      "  while (true) {\n" +
      "    console.log(1);\n" +
      "  }\n" +
      "};",
    res => {
      expect(res).toContain("for (;;)");
      expect(res).not.toContain("while (true)");
    }
  ]
];

TESTS.forEach(([name, code, verify]) => {
  test(name, async () => {
    verify(await rule(code));
  });
});
