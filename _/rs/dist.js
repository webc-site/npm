#!/usr/bin/env bun
import read from "@3-/read";
import int from "@3-/int";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import { $ } from "zx";

const argv = yargs(hideBin(process.argv))
    .usage("用法: $0 <目录>")
    .demandCommand(1, "请指定项目目录")
    .parseSync(),
  dir = argv._[0],
  pkgPath = path.resolve(dir, "package.json"),
  pkg = JSON.parse(read(pkgPath)),
  name = pkg.name,
  oldVersion = pkg.version || "0.1.0",
  parts = oldVersion.split(".");

parts[2] = String(int(parts[2]) + 1);

const newVersion = parts.join(".");

pkg.version = newVersion;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`${name} 版本号更新： ${oldVersion} → ${newVersion}`);

await $`git add "${pkgPath}"`;
await $`git commit -m "chore(release): bump ${name} version to ${newVersion}"`;

const tagName = `${name}-v${newVersion}`;
await $`git tag "${tagName}"`;
console.log(`已创建标签：${tagName}`);

await $`git push`;
await $`git push origin "${tagName}"`;
console.log(`成功推送提交和标签 ${tagName} 至远程仓库。`);
