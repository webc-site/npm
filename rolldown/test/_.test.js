#!/usr/bin/env -S bun test

import read from "@1-/read";
import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import bundle, { minifyTo } from "../src/_.js";

// 创建临时目录并写入测试文件，执行测试回调后清理
const run = async (onRun) => {
    const tmp_dir = await mkdtemp(join(tmpdir(), "rolldown_test_")),
      main_js = join(tmp_dir, "main.js");
    await Promise.all(
      Object.entries({
        [main_js]: 'import { val } from "./lib.js"; console.log(val);',
        [join(tmp_dir, "lib.js")]:
          'export const val = "target_val"; export const unused = "unused_val";',
      }).map(([path, content]) => writeFile(path, content)),
    );
    try {
      await onRun(main_js, tmp_dir);
    } finally {
      await rm(tmp_dir, { recursive: true, force: true });
    }
  },
  check = (code) => {
    expect(code).toContain("target_val");
    expect(code).not.toContain("unused_val");
    expect(code).not.toContain("sourceMappingURL");
  },
  tests = [
    [
      "内存打包",
      async (main_js) => {
        const org_content = await read(main_js),
          chunks = await bundle(main_js),
          [, code, map] = chunks[0];
        check(code);
        expect(map).toBeDefined();
        expect(await read(main_js)).toBe(org_content);
      },
    ],
    [
      "压缩",
      async (main_js) => {
        const chunks = await bundle(main_js, {}, false),
          [, code] = chunks[0],
          mini_chunks = await bundle(main_js, {}, true),
          [, mini_code] = mini_chunks[0];
        check(mini_code);
        expect(mini_code.length).toBeLessThan(code.length);
      },
    ],
    [
      "保存文件",
      async (main_js, tmp_dir) => {
        const out_js = join(tmp_dir, "out.js");
        await minifyTo(main_js, out_js, {});
        const code = await read(out_js),
          map = JSON.parse(await read(out_js + ".map"));
        check(code);
        expect(map.sources.some((s) => s.endsWith("main.js"))).toBe(true);
        expect(map.sources.some((s) => s.endsWith("lib.js"))).toBe(true);
        expect(map.sources.some((s) => s.includes("virtual-entry"))).toBe(false);
      },
    ],
  ];

tests.forEach(([name, onRun]) => test(name, () => run(onRun)));
