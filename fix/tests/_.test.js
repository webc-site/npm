#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import rule from "../src/rule.js";

const TESTS = [
  [
    "sleep 替换",
    "const run = async () => {\n" +
      "  await new Promise(resolve => setTimeout(resolve, 100));\n" +
      "};",
    ['import sleep from "@3-/sleep";', "sleep(100)"],
  ],
  [
    "sleep 替换且已有 import",
    'import sleep from "@3-/sleep";\n' +
      "const run = async () => {\n" +
      "  await new Promise(resolve => setTimeout(resolve, 100));\n" +
      "};",
    ["sleep(100)"],
    null,
    ["import sleep", 1],
  ],
  [
    "read 替换",
    'import { readFileSync } from "fs";\n' + 'const data = readFileSync("a.txt", "utf8");',
    ['import read from "@3-/read";', 'read("a.txt")'],
    ['import { readFileSync } from "fs";'],
  ],
  [
    "read 替换且已有 import",
    'import { readFileSync } from "fs";\n' +
      'import read from "@3-/read";\n' +
      'const data = readFileSync("a.txt", "utf8");',
    ['read("a.txt")'],
    ["readFileSync"],
    ["import read", 1],
  ],
  [
    "readAsync 替换",
    'import { readFile } from "fs/promises";\n' + 'const data = await readFile("a.txt", "utf8");',
    ['import read from "@1-/read";', 'read("a.txt")'],
    ['import { readFile } from "fs/promises";'],
  ],
  [
    "readAsync 属性调用替换",
    'import fs from "node:fs";\n' + 'const data = await fs.readFile(path, "utf8");',
    ['import read from "@1-/read";', "read(path)", 'import fs from "node:fs";'],
  ],
  [
    "readAsync 参数嵌套替换",
    'import { readFile } from "fs";\n' + 'const data = await readFile(join(dst, "a.txt"), "utf8");',
    ['import read from "@1-/read";', 'read(join(dst, "a.txt"))'],
    ['import { readFile } from "fs";'],
  ],
  [
    "readAsync 替换且已有 import",
    'import { readFile } from "fs/promises";\n' +
      'import read from "@1-/read";\n' +
      'const data = await readFile("a.txt", "utf8");',
    ['read("a.txt")'],
    ["readFile"],
    ["import read", 1],
  ],
  [
    "while 替换",
    "const run = () => {\n" + "  while (true) {\n" + "    console.log(1);\n" + "  }\n" + "};",
    ["for (;;)"],
    ["while (true)"],
  ],
  [
    "utf8e 替换",
    "const run = () => {\n" + "  const encoded = new TextEncoder().encode(key);\n" + "};",
    ['import utf8e from "@3-/utf8/utf8e.js";', "utf8e(key)"],
    ["new TextEncoder().encode(key)"],
  ],
  [
    "utf8e 替换且已有 import",
    'import utf8e from "@3-/utf8/utf8e.js";\n' +
      "const run = () => {\n" +
      "  const encoded = new TextEncoder().encode(key);\n" +
      "};",
    ["utf8e(key)"],
    null,
    ["import utf8e", 1],
  ],
  [
    "合并带注释的 const",
    "const a = 1;\n" + "// hello\n" + "const b = 2;",
    ["const a = 1,\n// hello\nb = 2;"],
  ],
  [
    "合并带块注释的 const",
    "const a = 1;\n" + "/* block */\n" + "const b = 2;",
    ["const a = 1,\n/* block */\nb = 2;"],
  ],
  [
    "合并带注释的 export const",
    "export const a = 1;\n" + "// hello\n" + "export const b = 2;",
    ["export const a = 1,\n// hello\nb = 2;"],
  ],
  [
    "合并多行注释的 const",
    "const a = 1;\n" + "// line 1\n" + "// line 2\n" + "const b = 2;",
    ["const a = 1,\n// line 1\n// line 2\nb = 2;"],
  ],
  [
    "process.env 替换",
    "const port = process.env.PORT || 8080;",
    ['import { env } from "node:process";', "const port = env.PORT || 8080;"],
  ],
  [
    "process.env 替换且已有 import",
    'import { env } from "node:process";\n' + "const port = process.env.PORT || 8080;",
    ["const port = env.PORT || 8080;"],
    null,
    ['import { env } from "node:process";', 1],
  ],
];

TESTS.forEach(([name, code, include, exclude, match]) => {
  test(name, async () => {
    const res = await rule(code);
    if (include) {
      include.forEach((i) => expect(res).toContain(i));
    }
    if (exclude) {
      exclude.forEach((e) => expect(res).not.toContain(e));
    }
    if (match) {
      const [pattern, count] = match;
      expect((res.match(new RegExp(pattern, "g")) || []).length).toBe(count);
    }
  });
});
