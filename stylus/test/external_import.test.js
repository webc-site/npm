#!/usr/bin/env -S bun test
import { describe } from "bun:test";
import { resolve } from "node:path";
import { runYamlCases } from "./helper.js";

const TEST_DIR = resolve(import.meta.dirname, "temp_external_tests");

describe("外部引入测试", () => {
  runYamlCases(resolve(import.meta.dirname, "external_import.yaml"), TEST_DIR);
});
