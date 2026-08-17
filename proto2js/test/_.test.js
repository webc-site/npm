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
  CASES = readdirSync(CASE_DIR).filter((dir) => statSync(join(CASE_DIR, dir)).isDirectory());

describe("扫描 case 目录自动化测试", () => {
  rmSync(OUT_DIR, { recursive: true, force: true });
  afterAll(() => rmSync(OUT_DIR, { recursive: true, force: true }));

  CASES.forEach((name) => {
    test("case: " + name, async () => {
      const case_dir = join(CASE_DIR, name),
        proto_file = join(case_dir, "_.proto"),
        data_file = join(case_dir, "_.js"),
        pkg = gen(proto_file, OUT_DIR, [case_dir]);
      expect(typeof pkg).toBe("string");

      const { type, mod_name, pb_payload, payload } = await import(data_file),
        mod_e = await importDefault(OUT_DIR, mod_name + "E.js"),
        mod_d = await importDefault(OUT_DIR, mod_name + "D.js"),
        root = await protobuf.load(proto_file),
        pb_type = root.lookupType(type),
        pb_encoded = new Uint8Array(pb_type.encode(pb_payload).finish()),
        custom_encoded = mod_e(payload),
        decoded_from_pb = mod_d(pb_encoded);

      // protobufjs 编码 -> 自定义解码
      expect(decoded_from_pb[0]).toEqual(payload[0]);

      // 自定义编码 -> protobufjs 解码
      const decoded_by_pb = pb_type.decode(custom_encoded);
      expect(pb_type.toObject(decoded_by_pb)).toBeDefined();

      // 二进制严格一致
      expect(custom_encoded).toEqual(pb_encoded);
    });
  });

  test("demo: Enum 常量与同构消息别名", async () => {
    const status_mod = await import(join(OUT_DIR, "demo/Status.js")),
      user_alias_e = await importDefault(OUT_DIR, "demo/UserAliasE.js"),
      user_e = await importDefault(OUT_DIR, "demo/UserE.js");

    expect(status_mod.UNKNOWN).toBe(0);
    expect(status_mod.OK).toBe(1);
    expect(status_mod.FAIL).toBe(2);
    expect(user_alias_e).toBe(user_e);
  });

  test("auth: oneof 分支与 Enum", async () => {
    const err_mod = await import(join(OUT_DIR, "auth/NewByMailErr.js")),
      res_e = await importDefault(OUT_DIR, "auth/NewByMailResponseE.js"),
      res_d = await importDefault(OUT_DIR, "auth/NewByMailResponseD.js"),
      root = await protobuf.load(join(CASE_DIR, "oneof/_.proto")),
      pb_type = root.lookupType("auth.NewByMailResponse");

    expect(err_mod.OK).toBe(0);
    expect(err_mod.ERR_MAIL_EXIST).toBe(1);
    expect(err_mod.ERR_NO_ORG).toBe(2);
    expect(err_mod.ERR_ORG_USER_EXIST).toBe(3);

    [
      [{ uid: 123456 }, [123456], [123456, 0]],
      [
        { err: err_mod.ERR_MAIL_EXIST },
        [undefined, err_mod.ERR_MAIL_EXIST],
        [0, err_mod.ERR_MAIL_EXIST]
      ]
    ].forEach(([pb_val, custom_val, expected_decoded]) => {
      const pb_encoded = new Uint8Array(pb_type.encode(pb_val).finish()),
        custom_encoded = res_e(custom_val);
      expect(custom_encoded).toEqual(pb_encoded);
      expect(res_d(pb_encoded)).toEqual(expected_decoded);
    });
  });

  test("目录转换测试", async () => {
    const dir_out = join(ROOT, "tmp_dir_out");
    rmSync(dir_out, { recursive: true, force: true });
    try {
      const pkgs = gen(CASE_DIR, dir_out);
      expect(Array.isArray(pkgs)).toBe(true);
      ["demo", "api", "base", "nested", "auth"].forEach((pkg) => {
        expect(pkgs).toContain(pkg);
      });

      const user_e = await importDefault(dir_out, "demo/UserE.js");
      expect(typeof user_e).toBe("function");
    } finally {
      rmSync(dir_out, { recursive: true, force: true });
    }
  });

  test("CLI 目录转换测试", async () => {
    const dir_out = join(ROOT, "tmp_cli_test_out");
    rmSync(dir_out, { recursive: true, force: true });
    try {
      const cli_path = join(ROOT, "../src/cli.js"),
        proc = Bun.spawnSync([process.execPath, cli_path, CASE_DIR, "-o", dir_out]);
      expect(proc.exitCode).toBe(0);

      const user_e = await importDefault(dir_out, "demo/UserE.js");
      expect(typeof user_e).toBe("function");
    } finally {
      rmSync(dir_out, { recursive: true, force: true });
    }
  });
});
