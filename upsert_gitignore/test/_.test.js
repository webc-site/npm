#!/usr/bin/env -S bun test

import read from "@3-/read";
import { expect, test } from "bun:test";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import upsertGitignore from "../src/_.js";

const FP = join(import.meta.dirname, "test.gitignore"),
  rm = () => {
    if (existsSync(FP)) {
      unlinkSync(FP);
    }
  };

test("更新", () => {
  rm();

  [
    [["node_modules"], "node_modules\n"],
    [[".env"], "node_modules\n.env\n"],
    [["node_modules"], "node_modules\n.env\n"],
    [[".env", "dist", "node_modules"], "node_modules\n.env\ndist\n"]
  ].forEach(([input, expected]) => {
    upsertGitignore(FP, input);
    expect(read(FP)).toBe(expected);
  });

  rm();
});
