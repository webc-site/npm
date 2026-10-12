#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import verNext from "../src/_.js";

test("递增", () => {
  [
    ["1.0.0", "1.0.1"],
    ["0.0.1", "0.0.2"],
    ["1.2.3", "1.2.4"],
    ["1.0", "1.1"],
    ["1.0.0.0", "1.0.0.1"],
    ["1", "2"],
    ["1.9", "1.10"]
  ].forEach(([ver, val]) => {
    expect(verNext(ver)).toBe(val);
  });
});
