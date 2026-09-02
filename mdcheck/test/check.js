import { expect, test } from "bun:test";

const check = (result, is_valid, err_lines) => {
  if (is_valid) {
    expect(result).toEqual([]);
  } else {
    expect(result.length).toBe(err_lines.length);
    err_lines.forEach((line, i) => {
      expect(result[i][0]).toBe(line);
      expect(result[i][1]).toContain("Parse error");
    });
  }
};

export const run = (fn, cases, toInput = (v) => v) => {
  cases.forEach(([input, is_valid, err_lines, name], index) => {
    test(name || "用例 " + index, async () => {
      check(await fn(toInput(input)), is_valid, err_lines);
    });
  });
};

export default check;
