#!/usr/bin/env -S bun test
import { expect, test } from "bun:test";
import { resolve } from "node:path";
import read from "@3-/read";
import { load } from "js-yaml";
import parse from "../src/parse.js";
import fmt from "../src/fmt.js";

const cases = load(read(resolve(import.meta.dirname, "fmt.yaml")));

cases.forEach(({ name, code, expected }) => {
  test(name, () => {
    expect(fmt(parse(code))).toBe(expected);
  });
});
