#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import minifyHtm from "../src/_.js";

const CASES = [
  ["压缩 HTML", "<div>   <p>hello</p>  </div>", "<div><p>hello</p></div>"],
  [
    "压缩 CSS",
    "<style>body { background: white; }</style>",
    "<style>body{background:#fff}</style>"
  ],
  [
    "压缩 JS 并移除脚本末尾分号",
    "<script>console.log('hello');</script>",
    "<script>console.log('hello')</script>"
  ]
];

CASES.forEach(([desc, input, output]) => {
  test(desc, () => {
    expect(minifyHtm(input)).toBe(output);
  });
});
