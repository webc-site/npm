import { test, expect } from "bun:test";
import str from "../src/encode/str.js";
import buf from "../src/encode/buf.js";
import val from "../src/encode/val.js";

test("str 编码", () => {
  [
    ["abc", "'abc'"],
    ["a'bc", "'a''bc'"],
    ["a'b'c'", "'a''b''c'''"],
  ].forEach(([raw, exp]) => expect(str(raw)).toBe(exp));
});

test("buf 编码", () => {
  [[Buffer.from([1, 2, 15, 16, 255]), "'AQIPEP8'"]].forEach(([raw, exp]) =>
    expect(buf(raw)).toBe(exp),
  );
});

test("val 编码", () => {
  [
    [null, "NULL"],
    [undefined, "NULL"],
    ["abc'", "'abc'''"],
    [123, "123"],
    [true, "1"],
    [false, "0"],
    [Buffer.from([10]), "'Cg'"],
  ].forEach(([raw, exp]) => expect(val(raw)).toBe(exp));
});
