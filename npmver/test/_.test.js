import { expect, test } from "bun:test";
import npmver from "../src/_.js";

test("npm 包版本", async () => {
  for (const pkg of ["webc.site", "@webc.site/math"]) {
    expect(await npmver(pkg)).toBeString();
  }
  expect(await npmver("non-existent-pkg-name-123456789-abcdefg")).toBeUndefined();
});
