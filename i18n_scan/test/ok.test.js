#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import ok from "../src/ok.js";

test("成功", async () => {
  const res = await ok(Promise.resolve(42));
  expect(res).toBe(1);
});

test("失败", async () => {
  const err = new Error("failed"),
    res = await ok(Promise.reject(err));
  expect(res).toBe(err);
});
