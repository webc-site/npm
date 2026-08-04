#!/usr/bin/env -S bun test

import { env } from "node:process";
import { test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import i18nyml from "../src/_.js";

let tmp_dir, original_env;

beforeAll(() => {
  tmp_dir = mkdtempSync(join(tmpdir(), "i18nyml-test-"));

  mkdirSync(join(tmp_dir, "en"), { recursive: true });
  mkdirSync(join(tmp_dir, "zh-CN"), { recursive: true });
  mkdirSync(join(tmp_dir, "zh"), { recursive: true });
  mkdirSync(join(tmp_dir, "fr"), { recursive: true });
  mkdirSync(join(tmp_dir, "sub", "fr"), { recursive: true });

  writeFileSync(join(tmp_dir, "en", "msg.yml"), "hello: hello en");
  writeFileSync(join(tmp_dir, "zh-CN", "msg.yml"), "hello: hello zh-CN");
  writeFileSync(join(tmp_dir, "zh", "msg.yml"), "hello: hello zh");
  writeFileSync(join(tmp_dir, "fr", "msg.yml"), "hello: hello fr");
  writeFileSync(join(tmp_dir, "sub", "fr", "msg.yml"), "hello: hello sub-fr");
});

afterAll(() => {
  if (tmp_dir) {
    rmSync(tmp_dir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  original_env = { ...env };
  for (const key of ["LANGUAGE", "LC_ALL", "LC_MESSAGES", "LANG"]) {
    env[key] = "";
  }
});

afterEach(() => {
  Object.assign(env, original_env);
  for (const key in env) {
    if (!(key in original_env)) {
      delete env[key];
    }
  }
});

test("i18nyml", () => {
  [
    ["zh_CN.UTF-8", tmp_dir, "msg", { hello: "hello zh-CN" }],
    ["zh_HK.UTF-8", tmp_dir, "msg", { hello: "hello zh" }],
    ["fr_FR.UTF-8", tmp_dir, "msg", { hello: "hello fr" }],
    ["ja_JP.UTF-8", tmp_dir, "msg", { hello: "hello en" }],
    ["ja_JP.UTF-8", tmp_dir, "non_existent", undefined],
    ["ja_JP.UTF-8", join(tmp_dir, "sub"), "msg", { hello: "hello sub-fr" }]
  ].forEach(([lang, dir, file, expected]) => {
    env.LANG = lang;
    expect(i18nyml(dir, file)).toEqual(expected);
  });
});
