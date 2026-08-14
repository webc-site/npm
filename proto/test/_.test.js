#!/usr/bin/env -S bun test

import { describe, expect, test } from "bun:test";
import * as E from "../src/E.js";
import * as D from "../src/D.js";
import protobuf from "protobufjs";

const INT32_MAX = 2147483647,
  INT32_MIN = -2147483648,
  UINT32_MAX = 4294967295,
  MAX_SAFE = Number.MAX_SAFE_INTEGER,
  MIN_SAFE = Number.MIN_SAFE_INTEGER,
  FIXED64_MAX = (2n ** 64n - 1n).toString(),
  SFIXED64_MAX = (2n ** 63n - 1n).toString(),
  SFIXED64_MIN = (-(2n ** 63n)).toString();

describe("标量类型", () => {
  const roundtrip = (e, d, val) => d(e(val));

  [
    ["int32 正常值", E.int32, D.int32, 12345, 12345],
    ["int32 负数", E.int32, D.int32, -999, -999],
    ["int32 最大值", E.int32, D.int32, INT32_MAX, INT32_MAX],
    ["int32 最小值", E.int32, D.int32, INT32_MIN, INT32_MIN],
    ["uint32 最大值", E.uint32, D.uint32, UINT32_MAX, UINT32_MAX],
    ["uint32 零", E.uint32, D.uint32, 0, 0],
    ["sint32 正数", E.sint32, D.sint32, 65536, 65536],
    ["sint32 负数", E.sint32, D.sint32, -65536, -65536],
    ["int64 安全大整数", E.int64, D.int64, MAX_SAFE, MAX_SAFE],
    ["int64 负安全大整数", E.int64, D.int64, MIN_SAFE, MIN_SAFE],
    ["uint64 大整数", E.uint64, D.uint64, MAX_SAFE, MAX_SAFE],
    ["sint64 正数", E.sint64, D.sint64, MAX_SAFE, MAX_SAFE],
    ["sint64 负数", E.sint64, D.sint64, MIN_SAFE, MIN_SAFE],
    ["fixed32", E.fixed32, D.fixed32, 123456, 123456],
    ["sfixed32", E.sfixed32, D.sfixed32, -123456, -123456],
    ["fixed64", E.fixed64, D.fixed64, 1234567890123n, 1234567890123n],
    ["sfixed64", E.sfixed64, D.sfixed64, -1234567890123n, -1234567890123n],
    ["bool 真", E.bool, D.bool, true, true],
    ["bool 假", E.bool, D.bool, false, false],
    ["string 文本", E.string, D.string, "你好 protobuf", "你好 protobuf"],
    ["string 空串", E.string, D.string, "", ""],
    ["bytes 字节", E.bytes, D.bytes, new Uint8Array([1, 2, 3, 4]), new Uint8Array([1, 2, 3, 4])]
  ].forEach(([name, enc, dec, input, expected]) => {
    test(name, () => {
      const actual = roundtrip(enc, dec, input);
      expect(actual).toEqual(expected);
    });
  });

  test("float 与 double 浮点数", () => {
    const f_val = 3.14159,
      d_val = 3.141592653589793;
    expect(Math.abs(D.float(E.float(f_val)) - f_val)).toBeLessThan(0.0001);
    expect(Math.abs(D.double(E.double(d_val)) - d_val)).toBeLessThan(1e-10);
  });
});

describe("列表 repeated packed", () => {
  [
    ["int32Li", E.int32Li, D.int32Li, [1, -2, 3, INT32_MAX, INT32_MIN]],
    ["uint32Li", E.uint32Li, D.uint32Li, [0, 100, UINT32_MAX]],
    ["sint32Li", E.sint32Li, D.sint32Li, [-100, 0, 100]],
    ["int64Li", E.int64Li, D.int64Li, [MIN_SAFE, 0, MAX_SAFE]],
    ["uint64Li", E.uint64Li, D.uint64Li, [0, MAX_SAFE]],
    ["sint64Li", E.sint64Li, D.sint64Li, [MIN_SAFE, 0, MAX_SAFE]],
    ["fixed32Li", E.fixed32Li, D.fixed32Li, [10, 20, 30]],
    ["sfixed32Li", E.sfixed32Li, D.sfixed32Li, [-10, 0, 20]],
    ["fixed64Li", E.fixed64Li, D.fixed64Li, [0n, 123n, BigInt(FIXED64_MAX)]],
    ["sfixed64Li", E.sfixed64Li, D.sfixed64Li, [BigInt(SFIXED64_MIN), 0n, BigInt(SFIXED64_MAX)]],
    ["boolLi", E.boolLi, D.boolLi, [true, false, true, true]],
    ["doubleLi", E.doubleLi, D.doubleLi, [1.1, 2.2, 3.3]]
  ].forEach(([name, enc, dec, input]) => {
    test(name, () => {
      const encoded = enc(input),
        decoded = dec(encoded);
      expect(decoded).toEqual(input);
    });
  });
});

describe("复合消息与 Map", () => {
  test("嵌套 Message 结构与空值默认填充", () => {
    const SubMessageE = E.$([E.int32, E.string]),
      SubMessageD = D.$([D.int32, D.string]),
      MessageE = E.$([
        E.int32,
        E.string,
        SubMessageE,
        [SubMessageE],
        E.int32Li,
        E.map(E.int32, E.string)
      ]),
      MessageD = D.$([
        D.int32,
        D.string,
        SubMessageD,
        [SubMessageD],
        D.int32Li,
        D.map(D.int32, D.string)
      ]),
      data = [
        42,
        "hello",
        [100, "inner"],
        [
          [1, "one"],
          [2, "two"]
        ],
        [10, 20, 30],
        [
          [1, "v1"],
          [2, "v2"]
        ]
      ],
      bin = MessageE(data),
      decoded = MessageD(bin);

    expect(decoded[0]).toBe(42);
    expect(decoded[1]).toBe("hello");
    expect(decoded[2]).toEqual([100, "inner"]);
    expect(decoded[3]).toEqual([
      [1, "one"],
      [2, "two"]
    ]);
    expect(decoded[4]).toEqual([10, 20, 30]);
    expect(decoded[5].toSorted()).toEqual([
      [1, "v1"],
      [2, "v2"]
    ]);
  });
});

describe("protobufjs 互操作兼容性", () => {
  test("与官方 protobufjs 编码二进制双向一致", () => {
    const root = new protobuf.Root();
    protobuf.parse(
      `
      syntax = "proto3";
      message Sample {
        int32 id = 1;
        string name = 2;
        repeated int32 tags = 3;
        bool is_ok = 4;
      }
    `,
      root,
      { keepCase: true }
    );
    root.resolveAll();

    const Sample = root.lookupType("Sample"),
      payload = {
        id: 12345,
        name: "test user",
        tags: [1, 2, 3, 999],
        is_ok: true
      },
      pbjsEncoded = new Uint8Array(Sample.encode(payload).finish()),
      customE = E.$([E.int32, E.string, E.int32Li, E.bool]),
      customD = D.$([D.int32, D.string, D.int32Li, D.bool]),
      customEncoded = customE([payload.id, payload.name, payload.tags, payload.is_ok]);

    expect(customEncoded).toEqual(pbjsEncoded);

    const fromPbjsDecoded = customD(pbjsEncoded);
    expect(fromPbjsDecoded[0]).toBe(payload.id);
    expect(fromPbjsDecoded[1]).toBe(payload.name);
    expect(fromPbjsDecoded[2]).toEqual(payload.tags);
    expect(fromPbjsDecoded[3]).toBe(payload.is_ok);
  });
});
