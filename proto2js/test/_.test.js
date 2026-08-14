#!/usr/bin/env -S bun test

import { afterAll, describe, expect, test } from "bun:test";
import gen from "../src/_.js";
import { join } from "node:path";
import { readdirSync, rmSync, statSync } from "node:fs";
import protobuf from "protobufjs";

const ROOT = import.meta.dirname,
  CASE_DIR = join(ROOT, "case"),
  OUT_DIR = join(ROOT, "tmp_out"),
  cases = readdirSync(CASE_DIR).filter((dir) => statSync(join(CASE_DIR, dir)).isDirectory());

describe("扫描 case 目录自动化测试", () => {
  rmSync(OUT_DIR, { recursive: true, force: true });
  afterAll(() => rmSync(OUT_DIR, { recursive: true, force: true }));

  cases.forEach((name) => {
    test("case: " + name, async () => {
      const case_dir = join(CASE_DIR, name),
        proto_file = join(case_dir, "_.proto"),
        data_file = join(case_dir, "_.js"),
        pkg = gen(proto_file, OUT_DIR, [case_dir]);
      expect(typeof pkg).toBe("string");

      const { type, modName, pbPayload, payload } = await import(data_file),
        modE = (await import(join(OUT_DIR, modName + "E.js"))).default,
        modD = (await import(join(OUT_DIR, modName + "D.js"))).default,
        root = await protobuf.load(proto_file),
        PbType = root.lookupType(type),
        pbEncoded = new Uint8Array(PbType.encode(pbPayload).finish()),
        customEncoded = modE(payload),
        // protobufjs 编码 -> 自定义解码
        decodedFromPb = modD(pbEncoded);
      expect(decodedFromPb[0]).toEqual(payload[0]);

      // 自定义编码 -> protobufjs 解码
      const decodedByPb = PbType.decode(customEncoded);
      expect(PbType.toObject(decodedByPb)).toBeDefined();

      // 二进制严格一致
      expect(customEncoded).toEqual(pbEncoded);
    });
  });

  test("demo: Enum 常量与同构消息别名", async () => {
    const statusMod = await import(join(OUT_DIR, "demo/Status.js")),
      userAliasE = await import(join(OUT_DIR, "demo/UserAliasE.js")),
      userE = await import(join(OUT_DIR, "demo/UserE.js"));

    expect(statusMod.UNKNOWN).toBe(0);
    expect(statusMod.OK).toBe(1);
    expect(statusMod.FAIL).toBe(2);
    expect(userAliasE.default).toBe(userE.default);
  });
});
