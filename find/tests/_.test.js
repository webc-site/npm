#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { join } from "node:path";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import find from "../src/_.js";

test("寻找目标", () => {
  const tmp = mkdtempSync(join(tmpdir(), "find-")),
    path_a = join(tmp, "a"),
    path_b = join(path_a, "b");

  mkdirSync(path_b, { recursive: true });
  writeFileSync(join(tmp, "r.txt"), "");
  writeFileSync(join(path_a, "m.txt"), "");

  [
    [path_a, "m.txt", path_a],
    [path_b, "r.txt", tmp],
    [path_b, "n.txt", undefined],
  ].forEach(([root, name, expected]) => {
    expect(find(root, name)).toBe(expected);
  });

  rmSync(tmp, { recursive: true, force: true });
});
