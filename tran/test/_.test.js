#!/usr/bin/env -S bun test

import { env } from "node:process";
import { mock, test, expect } from "bun:test";
import { rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const mock_homedir = join(import.meta.dirname, "tmp_home");
await mkdir(join(mock_homedir, ".config"), { recursive: true });
await writeFile(join(mock_homedir, ".config/webc.site.yml"), "token: test_conf_token");

mock.module("node:os", () => ({
  homedir: () => mock_homedir,
}));

env.WEBC_API = "http://api.mock.site/";
delete env.WEBC_TOKEN;

import tran from "../src/_.js";
import toLi from "../src/toLi.js";
import CODE from "@3-/lang/CODE.js";

const res = (val, status = 200) => ({
    status,
    text: async () => (typeof val === "string" ? val : JSON.stringify(val)),
  }),
  withTmpDir = async (name, fn) => {
    const dir = join(import.meta.dirname, name);
    try {
      await fn(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };

test("通过配置文件读取 token 进行扫描与翻译", () =>
  withTmpDir("tmp_test_dir", async (dir) => {
    const tran_yml = "tran:\n  from: zh\n  to_li:\n    - en\ndir:\n  - doc\n",
      zh_dir = join(dir, "doc/zh"),
      en_file = join(dir, "doc/en/a.md"),
      old_fetch = globalThis.fetch;

    await mkdir(zh_dir, { recursive: true });
    await writeFile(join(dir, "tran.yml"), tran_yml);
    await writeFile(join(zh_dir, "a.md"), "你好");

    globalThis.fetch = async (url, options) => {
      const u = typeof url === "string" ? url : url.url;
      if (u.endsWith("/tran/update")) {
        return res("ok");
      }
      if (u.endsWith("/tran")) {
        const [, , , txt] = JSON.parse(options.body);
        return res(["translated " + txt, 12345]);
      }
      return res("not found", 404);
    };

    try {
      await tran(dir);
      const en_content = await Bun.file(en_file).text();
      expect(en_content).toBe("translated 你好");
    } finally {
      globalThis.fetch = old_fetch;
      await rm(mock_homedir, { recursive: true, force: true });
    }
  }));

test("toLi 转换", () => {
  [
    ["*", CODE],
    [
      ["en", "zh"],
      ["en", "zh"],
    ],
    ["ja", ["ja"]],
    ["en  zh invalid", ["en", "zh"]],
    [
      ["en", "invalid", "de"],
      ["en", "de"],
    ],
    ["en  zh  en", ["en", "zh"]],
    [
      ["en", "zh", "en"],
      ["en", "zh"],
    ],
  ].forEach(([input, output]) => expect(toLi(input)).toEqual(output));
});
