#!/usr/bin/env bun
import read from "@3-/read";
import { $ } from "bun";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import ERR from "@3-/log/ERR.js";

const isPublished = async (dir) => {
    const pkg_path = join(dir, "package.json");
    if (!existsSync(pkg_path)) {
      return false;
    }
    const pkg = JSON.parse(read(pkg_path)),
      { name, version } = pkg;
    try {
      const result = await $`npm view ${name}@${version} version --quiet`.text();
      return result.trim().includes(version);
    } catch {
      return false;
    }
  },
  publishPkg = async (dir) => {
    const abs_dir = resolve(dir),
      pkg_path = join(abs_dir, "package.json");
    if (!existsSync(pkg_path)) {
      return;
    }
    const pkg = JSON.parse(read(pkg_path)),
      { name, version } = pkg;

    if (await isPublished(abs_dir)) {
      console.log("包 " + name + "@" + version + " 已经发布。跳过。");
      return;
    }

    console.log("正在发布 " + dir + " (" + name + "@" + version + ")...");
    try {
      await $`npm publish ${abs_dir} --provenance --access public`;
    } catch (error) {
      if (await isPublished(abs_dir)) {
        console.log(dir + " 中的包在发布过程中已成功发布。跳过。");
        return;
      }
      throw error;
    }
  },
  main = async () => {
    const npm_dir = "npm";
    if (existsSync(npm_dir)) {
      const files = readdirSync(npm_dir);
      for (const file of files) {
        const dir_path = join(npm_dir, file);
        if (statSync(dir_path).isDirectory()) {
          await publishPkg(dir_path);
        }
      }
    }

    // 最后发布主包
    await publishPkg(".");
  };

main().catch((err) => {
  ERR("发布失败:", err);
  process.exit(1);
});
