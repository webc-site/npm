#!/usr/bin/env -S bun test

import { afterAll, describe, expect, test } from "bun:test";
import gen from "../src/_.js";
import { join } from "node:path";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import protobuf from "protobufjs";

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
  repeated bool f28 = 28;
  repeated string f29 = 29;
  repeated bytes f30 = 30;
  User f31 = 31;
  repeated User f32 = 32;
  map<string, int32> f33 = 33;
  Status f34 = 34;
  repeated Status f35 = 35;
}

service DemoService {
  rpc ping(User) returns (User);
}
`;

describe("proto2js 编译与 protobufjs 双向交叉验证", () => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(DEMO_PROTO, PROTO_CONTENT);
  afterAll(() => rmSync(TMP_DIR, { recursive: true, force: true }));

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

  test("全类型与 protobufjs 双向编解码互通与二进制一致性", async () => {
    const fullMessageE = (await import(join(OUT_DIR, "demo/FullMessageE.js"))).default,
      fullMessageD = (await import(join(OUT_DIR, "demo/FullMessageD.js"))).default,
      root = await protobuf.load(DEMO_PROTO),
      PbFullMessage = root.lookupType("demo.FullMessage"),
      INT32_MAX = 2147483647,
      INT32_MIN = -2147483648,
      UINT32_MAX = 4294967295,
      MAX_SAFE = Number.MAX_SAFE_INTEGER,
      MIN_SAFE = Number.MIN_SAFE_INTEGER,
      FIXED64_MAX = (2n ** 64n - 1n).toString(),
      pbPayload = {
        f1: 1.23,
        f2: 4.5,
        f3: INT32_MIN,
        f4: -8938,
        f5: UINT32_MAX,
        f6: 10938,
        f7: INT32_MIN,
        f8: -93832,
        f9: UINT32_MAX,
        f10: "93814",
        f11: INT32_MIN,
        f12: "-9386",
        f13: true,
        f14: "hello world",
        f15: new Uint8Array([0, 1, 20, 35]),
        f16: [1.1, 2.2],
        f17: [3.5, 4.5],
        f18: [-9925, -633, 3232, 53322, INT32_MAX, INT32_MIN],
        f19: [-222732, -938182, 32812, 328331, MAX_SAFE, MIN_SAFE],
        f20: [9938, 1033, UINT32_MAX, 0],
        f21: [1122, 12992, MAX_SAFE],
        f22: [-38938, -9838, 32234, 523411, INT32_MAX, INT32_MIN],
        f23: [-9385, -9386, 98121, 81341, MAX_SAFE, MIN_SAFE],
        f24: [1938, 1832, UINT32_MAX, 0],
        f25: ["19032", "2220", String(MAX_SAFE), "0", FIXED64_MAX],
        f26: [-9913, -5992, 32412, INT32_MAX, INT32_MIN],
        f28: [true, false],
        f29: ["abc", "efghijklmn"],
        f30: [new Uint8Array([0, 4, 5]), new Uint8Array([0, 6, 7])],
        f31: { id: INT32_MAX, name: "John Doe" },
        f32: [
          { id: 10322, name: "f32 one" },
          { id: 23222, name: "f32 two" },
          { id: INT32_MIN, name: "f32 min" }
        ],
        f33: {
          k1: 200938,
          k2: 232231,
          k3: INT32_MIN,
          k4: INT32_MAX
        },
        f34: 2,
        f35: [1, 0, 2]
      },
      customPayload = [
        pbPayload.f1,
        pbPayload.f2,
        pbPayload.f3,
        pbPayload.f4,
        pbPayload.f5,
        pbPayload.f6,
        pbPayload.f7,
        pbPayload.f8,
        pbPayload.f9,
        BigInt(pbPayload.f10),
        pbPayload.f11,
        BigInt(pbPayload.f12),
        pbPayload.f13,
        pbPayload.f14,
        pbPayload.f15,
        pbPayload.f16,
        pbPayload.f17,
        pbPayload.f18,
        pbPayload.f19,
        pbPayload.f20,
        pbPayload.f21,
        pbPayload.f22,
        pbPayload.f23,
        pbPayload.f24,
        pbPayload.f25.map(BigInt),
        pbPayload.f26,
        undefined, // f27
        pbPayload.f28,
        pbPayload.f29,
        pbPayload.f30,
        [pbPayload.f31.id, pbPayload.f31.name],
        pbPayload.f32.map((u) => [u.id, u.name]),
        Object.entries(pbPayload.f33).map(([k, v]) => [k, v]),
        pbPayload.f34,
        pbPayload.f35
      ],
      pbEncoded = new Uint8Array(PbFullMessage.encode(pbPayload).finish()),
      customEncoded = fullMessageE(customPayload),
      // 1. 验证 protobufjs 编码能够被 proto2js 生成的解码器完美还原
      decodedFromPb = fullMessageD(pbEncoded);
    expect(decodedFromPb[0]).toBe(customPayload[0]);
    expect(decodedFromPb[13]).toBe(customPayload[13]);
    expect(decodedFromPb[14]).toEqual(customPayload[14]);
    expect(decodedFromPb[30]).toEqual(customPayload[30]);
    expect(decodedFromPb[31]).toEqual(customPayload[31]);
    expect(decodedFromPb[32].toSorted()).toEqual(customPayload[32].toSorted());
    expect(decodedFromPb[33]).toBe(customPayload[33]);
    expect(decodedFromPb[34]).toEqual(customPayload[34]);

    // 2. 验证 proto2js 生成的编码器输出能够被 protobufjs 官方解码器完美还原
    const decodedByPb = PbFullMessage.decode(customEncoded);
    expect(decodedByPb.f1).toBe(pbPayload.f1);
    expect(decodedByPb.f14).toBe(pbPayload.f14);
    expect(new Uint8Array(decodedByPb.f15)).toEqual(pbPayload.f15);
    expect(decodedByPb.f31.name).toBe(pbPayload.f31.name);
    expect(decodedByPb.f32.length).toBe(3);
    expect(decodedByPb.f33.k1).toBe(200938);
    expect(decodedByPb.f34).toBe(2);
    expect(decodedByPb.f35).toEqual([1, 0, 2]);

    // 3. 验证两端二进制编码完全逐字节一致
    expect(customEncoded).toEqual(pbEncoded);
  });
});
