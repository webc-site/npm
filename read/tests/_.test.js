#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import read from "../src/_.js";

test("read package.json", async () => {
  const content = await read(import.meta.dirname + "/../package.json");
  expect(content).toContain("@1-/read");
});
