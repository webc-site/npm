#!/usr/bin/env -S bun test

import { afterAll, describe, expect, test } from "bun:test";
import gen from "../src/_.js";
import { join } from "node:path";
import { readdirSync, rmSync } from "node:fs";
import protobuf from "protobufjs";

const ROOT = import.meta.dirname,
  CASE_DIR = join(ROOT, "case"),
  OUT_DIR = join(ROOT, "tmp_out");

describe("扫描 case 目录并编译测试", () => {
  rmSync(OUT_DIR, { recursive: true, force: true });
  afterAll(() => rmSync(OUT_DIR, { recursive: true, force: true }));

  const proto_files = readdirSync(CASE_DIR).filter((f) => f.endsWith(".proto"));

  test("扫描 case 目录并编译所有 proto 文件", () => {
    expect(proto_files.length).toBeGreaterThan(0);
    proto_files.forEach((file) => {
      const pkg = gen(join(CASE_DIR, file), OUT_DIR, [CASE_DIR]);
      expect(typeof pkg).toBe("string");
    });
  });

  test("demo.proto: Enum 与同构别名", async () => {
    const statusMod = await import(join(OUT_DIR, "demo/Status.js")),
      userAliasE = await import(join(OUT_DIR, "demo/UserAliasE.js")),
      userE = await import(join(OUT_DIR, "demo/UserE.js"));

    expect(statusMod.UNKNOWN).toBe(0);
    expect(statusMod.OK).toBe(1);
    expect(statusMod.FAIL).toBe(2);

    expect(userAliasE.default).toBe(userE.default);
  });

  test("demo.proto: 全类型与 protobufjs 双向交叉验证", async () => {
    const fullMessageE = (await import(join(OUT_DIR, "demo/FullMessageE.js"))).default,
      fullMessageD = (await import(join(OUT_DIR, "demo/FullMessageD.js"))).default,
      root = await protobuf.load(join(CASE_DIR, "demo.proto")),
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
        undefined,
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
      // protobufjs 编码 -> 自定义解码
      decodedFromPb = fullMessageD(pbEncoded);
    expect(decodedFromPb[0]).toBe(customPayload[0]);
    expect(decodedFromPb[13]).toBe(customPayload[13]);
    expect(decodedFromPb[14]).toEqual(customPayload[14]);
    expect(decodedFromPb[30]).toEqual(customPayload[30]);
    expect(decodedFromPb[31]).toEqual(customPayload[31]);
    expect(decodedFromPb[32].toSorted()).toEqual(customPayload[32].toSorted());
    expect(decodedFromPb[33]).toBe(customPayload[33]);
    expect(decodedFromPb[34]).toEqual(customPayload[34]);

    // 自定义编码 -> protobufjs 解码
    const decodedByPb = PbFullMessage.decode(customEncoded);
    expect(decodedByPb.f1).toBe(pbPayload.f1);
    expect(decodedByPb.f14).toBe(pbPayload.f14);
    expect(new Uint8Array(decodedByPb.f15)).toEqual(pbPayload.f15);
    expect(decodedByPb.f31.name).toBe(pbPayload.f31.name);
    expect(decodedByPb.f32.length).toBe(3);
    expect(decodedByPb.f33.k1).toBe(200938);
    expect(decodedByPb.f34).toBe(2);
    expect(decodedByPb.f35).toEqual([1, 0, 2]);

    // 二进制完全一致
    expect(customEncoded).toEqual(pbEncoded);
  });

  test("nested.proto: 嵌套 Message 编解码", async () => {
    const outerE = (await import(join(OUT_DIR, "nested/OuterE.js"))).default,
      outerD = (await import(join(OUT_DIR, "nested/OuterD.js"))).default,
      data = [
        [200, "success"],
        [
          [1, "item1"],
          [2, "item2"]
        ]
      ],
      encoded = outerE(data),
      decoded = outerD(encoded);

    expect(decoded).toEqual(data);
  });

  test("import_main.proto: 跨文件 Import 依赖编解码", async () => {
    const requestE = (await import(join(OUT_DIR, "api/RequestE.js"))).default,
      requestD = (await import(join(OUT_DIR, "api/RequestD.js"))).default,
      data = [[123456789, "span-001"], "getUserInfo"],
      encoded = requestE(data),
      decoded = requestD(encoded);

    expect(decoded).toEqual(data);
  });
});
