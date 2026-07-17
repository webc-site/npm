#!/usr/bin/env -S bun test
import { describe } from "bun:test";
import { resolve } from "node:path";
import { runYamlCases } from "./helper.js";

const TEST_DIR = resolve(import.meta.dirname, "temp_main_tests");

describe("stylus 编译器测试", () => {
  runYamlCases(resolve(import.meta.dirname, "main.yaml"), TEST_DIR);
});
