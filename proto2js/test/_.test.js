#!/usr/bin/env -S bun test

import { afterAll, describe, expect, test } from "bun:test";
import gen from "../src/_.js";
import { join } from "node:path";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const ROOT = import.meta.dirname,
  TMP_DIR = join(ROOT, "tmp"),
  OUT_DIR = join(TMP_DIR, "out"),
  DEMO_PROTO = join(TMP_DIR, "demo.proto"),
  PROTO_CONTENT = `syntax = "proto3";

package demo;

enum Status {
  UNKNOWN = 0;
  OK = 1;
  FAIL = 2;
}

message User {
  int32 id = 1;
  string name = 2;
}

message UserAlias {
  int32 uid = 1;
  string nickname = 2;
}

message FullMessage {
  double f1 = 1;
  float f2 = 2;
  int32 f3 = 3;
  int64 f4 = 4;
  uint32 f5 = 5;
  uint64 f6 = 6;
  sint32 f7 = 7;
  sint64 f8 = 8;
  fixed32 f9 = 9;
  fixed64 f10 = 10;
  sfixed32 f11 = 11;
  sfixed64 f12 = 12;
  bool f13 = 13;
  string f14 = 14;
  bytes f15 = 15;
  repeated double f16 = 16;
  repeated float f17 = 17;
  repeated int32 f18 = 18;
  repeated int64 f19 = 19;
  repeated uint32 f20 = 20;
  repeated uint64 f21 = 21;
  repeated sint32 f22 = 22;
  repeated sint64 f23 = 23;
  repeated fixed32 f24 = 24;
  repeated fixed64 f25 = 25;
  repeated sfixed32 f26 = 26;
  repeated sfixed64 f27 = 27;
  repeated bool f28 = 28;
  repeated string f29 = 29;
  repeated bytes f30 = 30;
  User f31 = 31;
  repeated User f32 = 32;
  map<int32, string> f33 = 33;
  Status f34 = 34;
  repeated Status f35 = 35;
}

service DemoService {
  rpc ping(User) returns (User);
}
`;

describe("proto2js 编译与编解码往返验证", () => {
  afterAll(() => rmSync(TMP_DIR, { recursive: true, force: true }));
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(DEMO_PROTO, PROTO_CONTENT);

  test("编译 proto 生成 ES 模块文件", () => {
    const pkg = gen(DEMO_PROTO, OUT_DIR);
    expect(pkg).toBe("demo");
  });

  test("导入生成的模块并验证 Enum 和同构别名", async () => {
    const statusMod = await import(join(OUT_DIR, "demo/Status.js")),
      userAliasE = await import(join(OUT_DIR, "demo/UserAliasE.js")),
      userE = await import(join(OUT_DIR, "demo/UserE.js"));

    expect(statusMod.UNKNOWN).toBe(0);
    expect(statusMod.OK).toBe(1);
    expect(statusMod.FAIL).toBe(2);

    expect(userAliasE.default).toBe(userE.default);
  });

  test("全类型往返编解码正确性", async () => {
    const fullMessageE = (await import(join(OUT_DIR, "demo/FullMessageE.js"))).default,
      fullMessageD = (await import(join(OUT_DIR, "demo/FullMessageD.js"))).default,
      INT32_MAX = 2147483647,
      INT32_MIN = -2147483648,
      UINT32_MAX = 4294967295,
      MAX_SAFE = Number.MAX_SAFE_INTEGER,
      MIN_SAFE = Number.MIN_SAFE_INTEGER,
      FIXED64_MAX = (2n ** 64n - 1n).toString(),
      SFIXED64_MAX = (2n ** 63n - 1n).toString(),
      SFIXED64_MIN = (-(2n ** 63n)).toString(),
      payload = [
        1.23, // f1
        4.56, // f2
        INT32_MIN, // f3
        -8938, // f4
        UINT32_MAX, // f5
        10938, // f6
        INT32_MIN, // f7
        -93832, // f8
        UINT32_MAX, // f9
        93814n, // f10
        INT32_MIN, // f11
        -9386n, // f12
        true, // f13
        "hello world", // f14
        new Uint8Array([0, 1, 20, 35]), // f15
        [1.1, 2.2], // f16
        [3.3, 4.4], // f17
        [-9925, -633, 3232, 53322, INT32_MAX, INT32_MIN], // f18
        [-222732, -938182, 32812, 328331, MAX_SAFE, MIN_SAFE], // f19
        [9938, 1033, UINT32_MAX, 0], // f20
        [1122, 12992, MAX_SAFE], // f21
        [-38938, -9838, 32234, 523411, INT32_MAX, INT32_MIN], // f22
        [-9385, -9386, 98121, 81341, MAX_SAFE, MIN_SAFE], // f23
        [1938, 1832, UINT32_MAX, 0], // f24
        [19032n, 2220n, BigInt(MAX_SAFE), 0n, BigInt(FIXED64_MAX)], // f25
        [-9913, -5992, 32412, INT32_MAX, INT32_MIN], // f26
        [
          -1993n,
          -5994n,
          23328n,
          BigInt(MAX_SAFE),
          BigInt(MIN_SAFE),
          BigInt(SFIXED64_MAX),
          BigInt(SFIXED64_MIN)
        ], // f27
        [true, false], // f28
        ["abc", "efghijklmn"], // f29
        [new Uint8Array([0, 4, 5]), new Uint8Array([0, 6, 7])], // f30
        [INT32_MAX, "John Doe"], // f31
        [
          [10322, "f32 one"],
          [23222, "f32 two"],
          [INT32_MIN, "f32 min"]
        ], // f32
        [
          [200938, "f33 two"],
          [232231, "f33 one"],
          [INT32_MIN, "f33 min"],
          [INT32_MAX, "f33 max"]
        ], // f33
        2, // f34 (FAIL)
        [1, 0, 2] // f35
      ],
      encoded = fullMessageE(payload),
      decoded = fullMessageD(encoded);

    expect(decoded.length).toBe(payload.length);

    payload.forEach((expected, idx) => {
      const actual = decoded[idx];
      if (idx === 1) {
        // f2 float
        expect(Math.abs(actual - expected)).toBeLessThan(0.0001);
      } else if (idx === 16) {
        // f17 repeated float
        actual.forEach((v, j) => {
          expect(Math.abs(v - expected[j])).toBeLessThan(0.0001);
        });
      } else if (idx === 32) {
        // f33 map
        expect(actual.toSorted()).toEqual(expected.toSorted());
      } else {
        expect(actual).toEqual(expected);
      }
    });
  });
});
