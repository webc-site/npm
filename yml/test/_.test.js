#!/usr/bin/env -S bun test

import read from "@3-/read";
import { test, expect } from "bun:test";
import { join, basename, extname } from "node:path";
import { readdirSync } from "node:fs";
import load from "../src/load.js";
import loads from "../src/loads.js";

const eq = (val, res) => expect(loads(val)).toEqual(res);

test("文件加载", () => {
  const case_dir = join(import.meta.dirname, "case"),
    files = readdirSync(case_dir);

  files.forEach((file) => {
    const ext = extname(file);
    if (ext === ".yml" || ext === ".txt") {
      const name = basename(file, ext),
        yml_path = join(case_dir, file),
        json_path = join(case_dir, name + ".json");

      expect(load(yml_path)).toEqual(JSON.parse(read(json_path)));
    }
  });
});

test("基础容错", () => {
  ["", null, undefined].forEach((val) => eq(val, {}));
});

test("引号与空键", () => {
  [
    ['"": 1', { "": 1 }],
    ['"key": 2', { key: 2 }],
    ["'key': 3", { key: 3 }],
    ['"":\n  "": 4', { "": { "": 4 } }],
    ['"foo\\"bar": 5', { 'foo"bar': 5 }]
  ].forEach(([input, expected]) => eq(input, expected));
});

test("多行文本", () => {
  [
    ["a: |\n  foo\n  bar\n", { a: "foo\nbar\n" }],
    ["a: |\n  foo\n  bar\n\n\n", { a: "foo\nbar\n" }],
    ["a: |-\n  foo\n  bar\n", { a: "foo\nbar" }],
    ["a: |-\n  foo\n  bar\n\n\n", { a: "foo\nbar" }],
    ["a: |+\n  foo\n  bar\n", { a: "foo\nbar\n" }],
    ["a: |+\n  foo\n  bar\n\n", { a: "foo\nbar\n\n" }],
    ["a: |+\n  foo\n  bar\n\n\n", { a: "foo\nbar\n\n\n" }],
    ["a: >\n  foo\n  bar\n", { a: "foo bar\n" }],
    ["a: >\n  foo\n  bar\n\n\n", { a: "foo bar\n" }],
    ["a: >-\n  foo\n  bar\n", { a: "foo bar" }],
    ["a: >-\n  foo\n  bar\n\n\n", { a: "foo bar" }],
    ["a: >+\n  foo\n  bar\n\n", { a: "foo bar\n\n" }],
    ["a: >\n  foo\n    bar\n  baz\n", { a: "foo\n  bar\nbaz\n" }],
    ["a: >\n  foo\n\n  bar\n", { a: "foo\n\nbar\n" }]
  ].forEach(([input, expected]) => eq(input, expected));
});

test("安全", () => {
  [
    ["toString: 123", { toString: 123 }],
    ["constructor: 456", { constructor: 456 }]
  ].forEach(([input, expected]) => eq(input, expected));

  const res = loads("__proto__:\n  polluted: true");
  expect(res.polluted).toBeUndefined();
  expect(Object.getPrototypeOf(res)).toBe(Object.prototype);
  expect(res.__proto__.polluted).toBe(true);
});

test("嵌套列表", () => {
  [
    [
      "- README.md\n- doc\n  - i18n.md\n  - use.md",
      [
        "README.md",
        {
          doc: ["i18n.md", "use.md"]
        }
      ]
    ],
    [
      "- a\n  - b\n    - c\n      - d\n        - e\n          - f.md",
      [
        {
          a: [
            {
              b: [
                {
                  c: [
                    {
                      d: [
                        {
                          e: ["f.md"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    ]
  ].forEach(([input, expected]) => eq(input, expected));
});
