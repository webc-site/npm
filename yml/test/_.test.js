#!/usr/bin/env -S bun test

import read from "@3-/read";
import { test, expect } from "bun:test";
import { join, basename, extname } from "node:path";
import { readdirSync } from "node:fs";
import load from "../src/load.js";
import loads from "../src/loads.js";

test("YAML加载用例", () => {
  const case_dir = join(import.meta.dirname, "case"),
    files = readdirSync(case_dir);

  files.forEach((file) => {
    const ext = extname(file);
    if (ext === ".yml" || ext === ".txt") {
      const name = basename(file, ext),
        yml_path = join(case_dir, file),
        json_path = join(case_dir, name + ".json"),
        received = load(yml_path),
        expected = JSON.parse(read(json_path));

      expect(received).toEqual(expected);
    }
  });
});

test("基础容错测试", () => {
  // 异常及空值输入容错
  expect(loads("")).toEqual({});
  expect(loads(null)).toEqual({});
  expect(loads(undefined)).toEqual({});
});
