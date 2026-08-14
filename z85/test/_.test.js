#!/usr/bin/env -S bun test

import utf8e from "@3-/utf8/utf8e.js";
import { test, expect } from "bun:test";
import base85 from "base85";
import z85e from "../src/z85e.js";
import z85d from "../src/z85d.js";

const err = (fn) => (val) => expect(fn(val)).toBeUndefined(),
  errE = err(z85e),
  errD = err(z85d);

test("随机编解码", () => {
  for (let i = 0; i < 10; ++i) {
    const data = crypto.getRandomValues(new Uint8Array(16)),
      ref_s = base85.encode(Buffer.from(data), "z85"),
      ref_e = utf8e(ref_s),
      dec = z85d(ref_e),
      ref_b = base85.decode(ref_s, "z85"),
      ref_d = new Uint8Array(ref_b);

    expect(z85e(data)).toEqual(ref_e);
    expect(dec).toBeInstanceOf(Uint8Array);
    expect(dec).toEqual(data);
    expect(dec).toEqual(ref_d);
  }
});

test("边界情况", () => {
  // 空输入
  const empty = new Uint8Array(0);
  expect(z85e(empty)).toEqual(empty);
  expect(z85d(empty)).toEqual(empty);

  // 非 Uint8Array 输入
  [[1, 2, 3, 4], "12345"].forEach((input) => {
    errE(input);
    errD(input);
  });

  // 编码输入长度非 4 的倍数
  [new Uint8Array(3), new Uint8Array(5)].forEach(errE);

  // 解码输入长度非 5 的倍数
  [new Uint8Array(4), new Uint8Array(6)].forEach(errD);

  // 解码包含非 Z85 字符
  [
    new Uint8Array([48, 48, 48, 48, 44]), // "0000,"
    new Uint8Array([32, 48, 48, 48, 48]) // " 0000"
  ].forEach(errD);

  // 解码溢出 (超过 2^32 - 1)
  errD(new Uint8Array([35, 35, 35, 35, 35])); // "#####"
});
