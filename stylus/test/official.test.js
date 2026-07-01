#!/usr/bin/env -S bun test
import { test, describe } from "bun:test";
import path from "node:path";
import { compareOfficial } from "./helper.js";

const OFFICIAL_DIR = path.resolve(import.meta.dirname, "official_cases");

describe("官方用例对比测试", () => {
  ["variable", "rulset", "import.basic"].forEach((name) => {
    test("匹配 " + name + " 案例", () => compareOfficial(name, OFFICIAL_DIR));
  });
});
