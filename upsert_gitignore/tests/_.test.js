#!/usr/bin/env -S bun test

import read from "@3-/read";
import { expect, test } from "bun:test";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import upsertGitignore from "../src/_.js";

const FILE_PATH = join(import.meta.dirname, "test.gitignore"),
  rmFile = () => {
    if (existsSync(FILE_PATH)) {
      unlinkSync(FILE_PATH);
    }
  };

test("更新 gitignore", () => {
  rmFile();

  [
    ["node_modules", "node_modules\n"],
    [".env", "node_modules\n.env\n"],
    ["node_modules", "node_modules\n.env\n"],
  ].forEach(([input, expected]) => {
    upsertGitignore(FILE_PATH, input);
    expect(read(FILE_PATH)).toBe(expected);
  });

  rmFile();
});
