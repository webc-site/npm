#!/usr/bin/env bun

import read from "@1-/read";
import { $, cd } from "zx";
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import org_name from "./src/npmOrg.js";
import urlExist from "@1-/url_exist";
import { spawnSync } from "node:child_process";
import ERR from "@3-/log/ERR.js";

const run = (cmd, args, dir) => {
    const { status, error } = spawnSync(cmd, args, { stdio: "inherit", cwd: dir });
    if (error) throw error;
    if (status !== 0) {
      throw new Error(`${cmd} ${args.join(" ")} failed with code ${status}`);
    }
  },
  ROOT = import.meta.dirname,
  publish = async (name, dir, repo) => {
    console.log(name + " 发布中");
    try {
      run("npm", ["publish", "--access", "public", "--registry=https://registry.npmjs.org"], dir);
      console.log(name + " 已发布");
      console.log(name + " 正在配置 Trusted Publisher...");
      run("npm", ["trust", "github", name, "--file", "cersei_rs.yml", "--repo", repo, "-y"], dir);
      console.log(name + " Trusted Publisher 配置成功");
    } catch (err) {
      ERR(name + " 发布/配置失败: " + err.message);
    }
  },
  pub = async (dir, npm_dir, org_name) => {
    const pkg_path = join(npm_dir, dir, "package.json");
    let pkg;
    const content = await read(pkg_path);
    pkg = JSON.parse(content);
    if (pkg.name && !pkg.name.startsWith("@" + org_name + "/")) {
      pkg.name = "@" + org_name + "/" + pkg.name;
      await writeFile(pkg_path, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    }

    const exists = await urlExist("https://registry.npmjs.org/" + pkg.name);
    console.log(pkg.name + ": " + (exists ? "已存在" : "不存在"));

    if (!exists) {
      const repoUrl = pkg.repository?.url || pkg.repository || "",
        match = repoUrl.match(/github\.com\/([^/]+\/[^/.]+)/),
        repo = match ? match[1] : "webc-site/npm";
      await publish(pkg.name, join(npm_dir, dir), repo);
    }
  };

cd(ROOT);

await $`rm -rf npm && bun x napi create-npm-dirs`;

const npm_dir = join(ROOT, "npm"),
  dirs = await readdir(npm_dir);

for (const dir of dirs) {
  await pub(dir, npm_dir, org_name);
}
