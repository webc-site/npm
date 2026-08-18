#!/usr/bin/env -S bun test

import { afterAll, describe, expect, test } from "bun:test";
import gen from "../src/_.js";
import { join } from "node:path";
import { readdirSync, rmSync, statSync } from "node:fs";
import protobuf from "protobufjs";

const ROOT = import.meta.dirname,
  CASE_DIR = join(ROOT, "case"),
  OUT_DIR = join(ROOT, "tmp_out"),
  CLI_JS = join(ROOT, "../src/cli.js"),
  rmDir = (dir) => rmSync(dir, { recursive: true, force: true }),
  importDefault = async (...paths) => (await import(join(...paths))).default,
  importED = (dir, name) =>
    Promise.all(["E", "D"].map((s) => importDefault(dir, name + s + ".js"))),
  pbEncode = (pb_type, val) => new Uint8Array(pb_type.encode(val).finish()),
  expectEnum = (mod, arr) => arr.forEach((k, v) => expect(mod[k]).toBe(v)),
  expectUserE = async (dir) =>
    expect(typeof (await importDefault(dir, "demo/UserE.js"))).toBe("function"),
  withTmpDir = async (name, fn) => {
    const dir = join(ROOT, name);
    rmDir(dir);
    try {
      await fn(dir);
    } finally {
      rmDir(dir);
    }
  },
  CASES = readdirSync(CASE_DIR).filter((dir) => statSync(join(CASE_DIR, dir)).isDirectory());

describe("用例测试", () => {
  rmDir(OUT_DIR);
  afterAll(() => rmDir(OUT_DIR));

  CASES.forEach((name) => {
    test("用例 " + name, async () => {
      const case_dir = join(CASE_DIR, name),
        proto_file = join(case_dir, "_.proto"),
        data_file = join(case_dir, "_.js");

      expect(typeof gen(proto_file, OUT_DIR, [case_dir])).toBe("string");

      const { type, mod_name, pb_payload, payload } = await import(data_file),
        [mod_e, mod_d] = await importED(OUT_DIR, mod_name),
        root = await protobuf.load(proto_file),
        pb_type = root.lookupType(type),
        pb_encoded = pbEncode(pb_type, pb_payload),
        custom_encoded = mod_e(payload);

      // protobufjs 编码 -> 自定义解码
      expect(mod_d(pb_encoded)[0]).toEqual(payload[0]);

      // 自定义编码 -> protobufjs 解码
      expect(pb_type.toObject(pb_type.decode(custom_encoded))).toBeDefined();

      // 二进制严格一致
      expect(custom_encoded).toEqual(pb_encoded);
    });
  });

  test("枚举与消息别名", async () => {
    const [status_mod, user_alias_e, user_e] = await Promise.all([
      import(join(OUT_DIR, "demo/Status.js")),
      importDefault(OUT_DIR, "demo/UserAliasE.js"),
      importDefault(OUT_DIR, "demo/UserE.js")
    ]);

    expectEnum(status_mod, ["UNKNOWN", "OK", "FAIL"]);
    expect(user_alias_e).toBe(user_e);
  });

  test("oneof 分支与枚举", async () => {
    const err_mod = await import(join(OUT_DIR, "auth/NewByMailErr.js")),
      [res_e, res_d] = await importED(OUT_DIR, "auth/NewByMailResponse"),
      root = await protobuf.load(join(CASE_DIR, "oneof/_.proto")),
      pb_type = root.lookupType("auth.NewByMailResponse");

    expectEnum(err_mod, ["OK", "ERR_MAIL_EXIST", "ERR_NO_ORG", "ERR_ORG_USER_EXIST"]);

    [
      [{ uid: 123456 }, [123456], [123456, 0]],
      [
        { err: err_mod.ERR_MAIL_EXIST },
        [undefined, err_mod.ERR_MAIL_EXIST],
        [0, err_mod.ERR_MAIL_EXIST]
      ]
    ].forEach(([pb_val, custom_val, expected]) => {
      const pb_encoded = pbEncode(pb_type, pb_val);
      expect(res_e(custom_val)).toEqual(pb_encoded);
      expect(res_d(pb_encoded)).toEqual(expected);
    });
  });

  test("目录转换", () =>
    withTmpDir("tmp_dir_out", async (dir) => {
      const pkgs = gen(CASE_DIR, dir);
      expect(Array.isArray(pkgs)).toBe(true);
      ["demo", "api", "base", "nested", "auth"].forEach((pkg) => {
        expect(pkgs).toContain(pkg);
      });
      await expectUserE(dir);
    }));

  test("CLI 转换", () =>
    withTmpDir("tmp_cli_test_out", async (dir) => {
      expect(Bun.spawnSync([process.execPath, CLI_JS, CASE_DIR, "-o", dir]).exitCode).toBe(0);
      await expectUserE(dir);
    }));
});
