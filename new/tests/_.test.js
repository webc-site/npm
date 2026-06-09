#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import newProj from "../src/_.js";

const withTmp = async (run) => {
  const tmp = await mkdtemp(join(tmpdir(), "new-test-"));
  try {
    await run(tmp);
  } finally {
    await rm(tmp, { recursive: true });
  }
};

test("自定义模板", () =>
  withTmp(async (tmp) => {
    const tmpl = join(tmp, "tmpl"),
      dst = join(tmp, "dst");

    await mkdir(tmpl);
    await writeFile(join(tmpl, "a.txt"), "hello tmpl world\ntemplate is nice\nthis is tmpl");

    await newProj(dst, "newproj", tmpl);

    const txt = await readFile(join(dst, "a.txt"), "utf8");
    expect(txt).toBe("hello newproj world\ntemplate is nice\nthis is newproj");
  }));

test("自动寻找 git 根模板", () =>
  withTmp(async (tmp) => {
    const dst = join(tmp, "dst");

    await newProj(dst, "newproj");

    expect(existsSync(join(dst, "package.json"))).toBe(true);
  }));
