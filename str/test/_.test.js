#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import indentTxtLi from "../src/indentTxtLi.js";

const cases = [
  ["", [["", ""]]],
  [" ", [[" ", ""]]],
  [
    " \n",
    [
      [" ", ""],
      ["", ""]
    ]
  ],
  [
    "\n",
    [
      ["", ""],
      ["", ""]
    ]
  ],
  [
    "\r\n",
    [
      ["", ""],
      ["", ""]
    ]
  ],
  ["a", [["", "a"]]],
  ["  a", [["  ", "a"]]],
  ["  a  ", [["  ", "a"]]],
  ["  a \t\v\f", [["  ", "a"]]],
  [
    "  a\n  b",
    [
      ["  ", "a"],
      ["  ", "b"]
    ]
  ],
  [
    "  a\r\n  b\r\n",
    [
      ["  ", "a"],
      ["  ", "b"],
      ["", ""]
    ]
  ],
  [
    "  a\n\n  b\n",
    [
      ["  ", "a"],
      ["", ""],
      ["  ", "b"],
      ["", ""]
    ]
  ],
  [
    " \t a \t\v\f \n \t b \t\v\f",
    [
      [" \t ", "a"],
      [" \t ", "b"]
    ]
  ],
  [
    "a\r",
    [
      ["", "a"],
      ["", ""]
    ]
  ],
  [
    "a\rb",
    [
      ["", "a"],
      ["", "b"]
    ]
  ],
  [
    "a\r\nb",
    [
      ["", "a"],
      ["", "b"]
    ]
  ]
];

test("正确性测试", () => {
  cases.forEach(([input, expected]) => {
    expect(indentTxtLi(input)).toEqual(expected);
  });
});
