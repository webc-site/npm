#!/usr/bin/env -S bun test

import { afterAll, describe, expect, test } from "bun:test";
import gen from "../src/_.js";
import { join } from "node:path";
import { readdirSync, rmSync, statSync } from "node:fs";
import protobuf from "protobufjs";

const ROOT = import.meta.dirname,
  CASE_DIR = join(ROOT, "case"),
  OUT_DIR = join(ROOT, "tmp_out"),
  importDefault = async (...paths) => (await import(join(...paths))).default,
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
        modE = await importDefault(OUT_DIR, modName + "E.js"),
        modD = await importDefault(OUT_DIR, modName + "D.js"),
        root = await protobuf.load(proto_file),
        PbType = root.lookupType(type),
        pbEncoded = new Uint8Array(PbType.encode(pbPayload).finish()),
        customEncoded = modE(payload),
        decodedFromPb = modD(pbEncoded);

      // protobufjs 编码 -> 自定义解码
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
      userAliasE = await importDefault(OUT_DIR, "demo/UserAliasE.js"),
      userE = await importDefault(OUT_DIR, "demo/UserE.js");

    expect(statusMod.UNKNOWN).toBe(0);
    expect(statusMod.OK).toBe(1);
    expect(statusMod.FAIL).toBe(2);
    expect(userAliasE).toBe(userE);
  });

  test("目录转换测试", async () => {
    const DIR_OUT = join(ROOT, "tmp_dir_out");
    rmSync(DIR_OUT, { recursive: true, force: true });
    try {
      const pkgs = gen(CASE_DIR, DIR_OUT);
      expect(Array.isArray(pkgs)).toBe(true);
      expect(pkgs).toContain("demo");
      expect(pkgs).toContain("api");
      expect(pkgs).toContain("base");
      expect(pkgs).toContain("nested");

      const userE = await importDefault(DIR_OUT, "demo/UserE.js");
      expect(typeof userE).toBe("function");
    } finally {
      rmSync(DIR_OUT, { recursive: true, force: true });
    }
  });

  test("CLI 目录转换测试", async () => {
    const DIR_OUT = join(ROOT, "tmp_cli_test_out");
    rmSync(DIR_OUT, { recursive: true, force: true });
    try {
      const cliPath = join(ROOT, "../src/cli.js"),
        proc = Bun.spawnSync([process.execPath, cliPath, CASE_DIR, "-o", DIR_OUT]);
      expect(proc.exitCode).toBe(0);

      const userE = await importDefault(DIR_OUT, "demo/UserE.js");
      expect(typeof userE).toBe("function");
    } finally {
      rmSync(DIR_OUT, { recursive: true, force: true });
    }
  });
});
