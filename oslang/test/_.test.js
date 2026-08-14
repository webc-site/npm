#!/usr/bin/env -S bun test

import { env } from "node:process";
import { test, expect } from "bun:test";
import raw from "../src/_.js";
import all from "../src/all.js";
import match from "../src/match.js";

const run = (code, env_map) => {
  const { stdout } = Bun.spawnSync({
    cmd: ["bun", "-e", code],
    cwd: import.meta.dir + "/..",
    env: { PATH: env.PATH, ...env_map }
  });
  return stdout.toString().trim();
};

test("类型验证", () => {
  [raw, all].forEach((fn) => {
    expect(fn.constructor.name).toBe("GeneratorFunction");
  });
});

test("支持列表", () => {
  const cases = [
    [{ LC_ALL: "zh_CN.UTF-8" }, "zh-cn"],
    [{ LANG: "zh_TW.Big5" }, "zh-tw"]
  ];
  cases.forEach(([env_map, first_lang]) => {
    const langs = JSON.parse(
      run("import p from './src/all.js'; console.log(JSON.stringify(Array.from(p())))", env_map)
    );
    expect(langs[0]).toBe(first_lang);
    expect(langs[1]).toBe("zh");
    expect(langs.includes("en")).toBe(true);
  });
});

test("优先级顺序", () => {
  const cases = [
    [["en", "zh-CN"], { LC_ALL: "zh_CN.UTF-8" }, "zh-CN"],
    [["en", "zh-TW", "zh-CN"], { LC_ALL: "zh_CN.UTF-8" }, "zh-CN"],
    [["en", "zh-CN", "zh-TW"], { LANG: "zh_TW.Big5" }, "zh-TW"]
  ];
  cases.forEach(([list, env_map, expected]) => {
    const code =
      "import match from './src/match.js'; console.log(match(" +
      JSON.stringify(list) +
      ").next().value || '')";
    expect(run(code, env_map)).toBe(expected);
  });
});

test("语言匹配", () => {
  const cases = [
    [["fr", "de"], undefined],
    [["fr", "en"], "en"],
    [["fr", "EN"], "EN"],
    [["", "en"], "en"]
  ];
  cases.forEach(([list, expected]) => {
    expect(match(list).next().value).toBe(expected);
  });
});
