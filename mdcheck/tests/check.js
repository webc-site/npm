import { expect } from "bun:test";

export default (result, is_valid, err_lines) => {
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
