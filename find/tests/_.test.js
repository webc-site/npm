#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { join } from "node:path";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import find from "../src/_.js";

test("寻找目标", () => {
  const tmp = mkdtempSync(join(tmpdir(), "find-")),
    p1 = join(tmp, "a"),
    p2 = join(p1, "b");

  mkdirSync(p2, { recursive: true });
  writeFileSync(join(tmp, "r.txt"), "");
  writeFileSync(join(p1, "m.txt"), "");

  [
    [p1, "m.txt", p1],
    [p2, "r.txt", tmp],
    [p2, "n.txt", undefined],
  ].forEach(([root, name, expected]) => {
    expect(find(root, name)).toBe(expected);
  });

  rmSync(tmp, { recursive: true, force: true });
});
