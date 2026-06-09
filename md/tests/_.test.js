#!/usr/bin/env -S bun test

import read from "@3-/read";
import { test, expect } from "bun:test";

import { join } from "node:path";
import li from "../src/li.js";
import code from "../src/code.js";

test("extract generic code blocks from test.md", () => {
  const mdPath = join(import.meta.dirname, "test.md"),
    md = read(mdPath),
    lines = li(md),
    result = code(lines);

  expect(result).toEqual([
    ["mermaid", 3, 6],
    ["javascript", 10, 13],
    ["mermaid", 16, 20],
  ]);
});
