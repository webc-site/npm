import { test, expect } from "bun:test";
import clean from "../src/_.js";

test("package_clean", () => {
  const pkg = {
      name: "test-pkg",
      version: "1.0.0",
      devDependencies: {
        foo: "^1.0.0"
      },
      exports: {
        ".": "./src/_.js"
      }
    },
    res = clean(pkg);
  expect(res.version).toBe("1.0.0");
  expect(res.devDependencies).toBeUndefined();
  expect(res.exports["."]).toBe("./src/_.js");
});
