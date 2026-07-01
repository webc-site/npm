#!/usr/bin/env -S bun test
import { describe } from "bun:test";
import { testDir } from "./helper.js";

[
  ["bug", "修复"],
  ["case", "对比"],
].forEach(([dir, prefix]) => {
  describe(`${prefix}测试`, async () => {
    await testDir(dir, prefix);
  });
});
