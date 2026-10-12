#!/usr/bin/env bun
import read from "@3-/read";
import int from "@3-/int";
import fs from "fs";
import path from "path";
import { $ } from "zx";

export default async (dir) => {
  const pkgPath = path.resolve(dir, "package.json"),
    pkg = JSON.parse(read(pkgPath)),
    name = pkg.name,
    oldVersion = pkg.version || "0.1.0",
    parts = oldVersion.split(".");

  parts[2] = String(int(parts[2]) + 1);

  const ver = parts.join("."),
    tagName = `${name}-v${ver}`;

  pkg.version = ver;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${name} 版本号更新： ${oldVersion} → ${ver}`);

  await $`git add ${pkgPath}`;
  await $`git commit -m "chore(release): bump ${name} version to ${ver}"`;
  await $`git tag ${tagName}`;
  await $`git push`;
  await $`git push origin ${tagName}`;
};
