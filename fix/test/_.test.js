#!/usr/bin/env -S bun test
import { test, expect } from "bun:test";
import { resolve } from "node:path";
import read from "@3-/read";
import { load } from "js-yaml";
import rule from "../src/rule.js";

const path = resolve(import.meta.dirname, "case.yml"),
  tests = load(read(path));

tests.forEach((t) => {
  const { name, code, include, exclude, match } = t;
  test(name, async () => {
    const res = (await rule(code)) ?? code;
    if (include) {
      include.forEach((i) => expect(res).toContain(i));
    }
    if (exclude) {
      exclude.forEach((e) => expect(res).not.toContain(e));
    }
    if (match) {
      const [pattern, count] = match;
      expect((res.match(new RegExp(pattern, "g")) || []).length).toBe(count);
    }
  });
});
