import { test, expect } from "bun:test";
import str from "../src/encode/str.js";
import buf from "../src/encode/buf.js";
import val from "../src/encode/val.js";

test("str 编码测试", () => {
  expect(str("abc")).toBe("'abc'");
  expect(str("a'bc")).toBe("'a''bc'");
  expect(str("a'b'c'")).toBe("'a''b''c'''");
});

test("buf 编码测试", () => {
  expect(buf(new Uint8Array([1, 2, 15, 16, 255]))).toBe("x'01020f10ff'");
});

test("val 编码测试", () => {
  expect(val(null)).toBe("NULL");
  expect(val(undefined)).toBe("NULL");
  expect(val("abc'")).toBe("'abc'''");
  expect(val(123)).toBe("123");
  expect(val(true)).toBe("1");
  expect(val(false)).toBe("0");
  expect(val(new Uint8Array([10]))).toBe("x'0a'");
});
