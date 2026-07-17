#!/usr/bin/env -S bun test
import { describe } from "bun:test";
import { resolve } from "node:path";
import { runYamlCases } from "./helper.js";

const TEST_DIR = resolve(import.meta.dirname, "temp_nesting_keep_tests");

describe("CSS 嵌套保留测试", () => {
  runYamlCases(resolve(import.meta.dirname, "nesting_keep.yaml"), TEST_DIR);
});
