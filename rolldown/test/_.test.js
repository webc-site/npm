#!/usr/bin/env -S bun test

import read from "@1-/read";
import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
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
          chunks = await bundle([main_js]),
          [, code, map] = chunks[0];
        check(code);
        expect(map).toBeDefined();
        expect(await read(main_js)).toBe(org_content);
      },
    ],
    [
      "压缩",
      async (main_js) => {
        const chunks = await bundle([main_js], {}, false),
          [, code] = chunks[0],
          mini_chunks = await bundle([main_js], {}, true),
          [, mini_code] = mini_chunks[0];
        check(mini_code);
        expect(mini_code.length).toBeLessThan(code.length);
      },
    ],
    [
      "保存文件",
      async (main_js, tmp_dir) => {
        const out_js = join(tmp_dir, "out.js");
        await minifyTo([main_js], [out_js], {});
        const code = await read(out_js),
          map = JSON.parse(await read(out_js + ".map"));
        check(code);
        expect(map.sources.some((s) => s.endsWith("main.js"))).toBe(true);
        expect(map.sources.some((s) => s.endsWith("lib.js"))).toBe(true);
        expect(map.sources.some((s) => s.includes("virtual-entry"))).toBe(false);
      },
    ],
    [
      "对象输入保存文件",
      async (main_js, tmp_dir) => {
        const out_main = join(tmp_dir, "out/main.js"),
          out_sub = join(tmp_dir, "out/sub/sub.js"),
          created_dirs = await mkdtemp(join(tmp_dir, "sub_")),
          created_js = join(created_dirs, "sub.js");
        await writeFile(created_js, 'import { val } from "../lib.js"; console.log("sub:" + val);');

        await mkdir(dirname(out_main), { recursive: true });
        await mkdir(dirname(out_sub), { recursive: true });

        await minifyTo(
          {
            main: main_js,
            "sub/sub": created_js,
          },
          {
            main: out_main,
            "sub/sub": out_sub,
          },
          {},
        );

        const main_code = await read(out_main),
          sub_code = await read(out_sub);

        expect(main_code).toContain("console.log");
        expect(sub_code).toContain("console.log");

        expect(existsSync(out_main)).toBe(true);
        expect(existsSync(out_sub)).toBe(true);
      },
    ],
  ];

tests.forEach(([name, onRun]) => test(name, () => run(onRun)));
