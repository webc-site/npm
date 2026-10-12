#!/usr/bin/env -S bun test

import utf8e from "@3-/utf8/utf8e.js";
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import bufmd5 from "../src/bufmd5.js";
import strmd5 from "../src/strmd5.js";

const md5 = (data) => new Uint8Array(createHash("md5").update(data).digest());

test("bufmd5 长度限制", () => {
  [0, 1, 16, 17, 100].forEach((len) => {
    const buf = new Uint8Array(len),
      res = bufmd5(buf);
    if (len <= 16) {
      expect(res).toBe(buf);
    } else {
      expect(res).toEqual(md5(buf));
    }
  });
});

test("strmd5 转换与限制", () => {
  [
    ["", 0],
    ["1234567890123456", 16],
    ["12345678901234567", 17],
    ["中文测试", 12],
    ["中文测试超过十六字节", 30]
  ].forEach(([str, len]) => {
    const res = strmd5(str),
      buf = utf8e(str);
    expect(buf.length).toBe(len);
    if (len <= 16) {
      expect(res).toEqual(buf);
    } else {
      expect(res).toEqual(md5(buf));
    }
  });
});
