import { test, expect } from "bun:test";
import { join } from "node:path";
import scan from "../src/scan.js";

test("扫描目录", async () => {
  const dir = join(import.meta.dirname, "md"),
    err_li = await scan(dir),
    err_map = new Map(err_li);

  expect(err_map.size).toBe(2);

  [
    ["invalid.md", 9],
    ["multiple.md", 15],
  ].forEach(([file, line]) => {
    expect(err_map.has(file)).toBe(true);
    expect(err_map.get(file)[0][0]).toBe(line);
  });
});

test("扫描目录并过滤", async () => {
  const dir = join(import.meta.dirname, "md"),
    filter = (abs_path) => abs_path.includes("multiple"),
    err_li = await scan(dir, filter),
    err_map = new Map(err_li);

  expect(err_map.size).toBe(1);
  expect(err_map.has("invalid.md")).toBe(true);
  expect(err_map.has("multiple.md")).toBe(false);
});
