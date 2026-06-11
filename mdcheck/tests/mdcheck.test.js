import { test, expect } from "bun:test";
import { join } from "node:path";
import mdcheck from "../src/mdcheck.js";

const dir = join(import.meta.dirname, "md");

test("扫描目录", async () => {
  const err_li = await mdcheck(dir),
    err_map = new Map(err_li);

  expect(err_map.size).toBe(2);
  expect(err_map.has("invalid.md")).toBe(true);
  expect(err_map.has("multiple.md")).toBe(true);
});

[
  ["invalid.md", 1, "invalid.md", 9],
  ["valid.md", 0],
  ["non_existent.md", 0],
].forEach(([file, len, rel_path, first_err_line]) => {
  test("扫描 " + file, async () => {
    const err_li = await mdcheck(join(dir, file));
    expect(err_li.length).toBe(len);
    if (len) {
      expect(err_li[0][0]).toBe(rel_path);
      expect(err_li[0][1][0][0]).toBe(first_err_line);
    }
  });
});
