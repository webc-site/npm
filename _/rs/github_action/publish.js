#!/usr/bin/env bun
import read from "@3-/read";
import { $ } from "bun";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import exist from "../lib/exist.js";

const publishPkg = async (dir) => {
    const pkg_path = join(dir, "package.json");
    if (!existsSync(pkg_path)) {
      return;
    }
    const pkg = JSON.parse(read(pkg_path)),
      { name, version } = pkg;

    if (await exist(name, version)) {
      console.log("包 " + name + "@" + version + " 已发布");
      return;
    }

    await $`npm publish ${dir} --provenance --access public`;
  },
  main = async () => {
    const npm_dir = resolve("npm");
    for (const file of readdirSync(npm_dir)) {
      const dir_path = join(npm_dir, file);
      if (statSync(dir_path).isDirectory()) {
        await publishPkg(dir_path);
      }
    }
    // 最后发布主包
    await publishPkg(".");
  };

if (import.meta.main) {
  await main();
}
