#!/usr/bin/env bun
import read from "@3-/read";
import { $ } from "bun";
import fs from "node:fs";
import path from "node:path";

async function isPublished(dir) {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(read(pkgPath)),
    { name, version } = pkg;
  try {
    const result = await $`npm view ${name}@${version} version --quiet`.text();
    return result.trim().includes(version);
  } catch {
    return false;
  }
}

async function publishPkg(dir) {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(read(pkgPath)),
    { name, version } = pkg;

  if (await isPublished(dir)) {
    console.log(`包 ${name}@${version} 已经发布。跳过。`);
    return;
  }

  console.log(`正在发布 ${dir} (${name}@${version})...`);
  try {
    await $`npm publish ${dir} --provenance --access public`;
  } catch (error) {
    if (await isPublished(dir)) {
      console.log(`${dir} 中的包在发布过程中已成功发布。跳过。`);
      return;
    }
    throw error;
  }
}

async function main() {
  const npmDir = "npm";
  if (fs.existsSync(npmDir)) {
    const files = fs.readdirSync(npmDir);
    for (const file of files) {
      const dirPath = path.join(npmDir, file);
      if (fs.statSync(dirPath).isDirectory()) {
        await publishPkg(dirPath);
      }
    }
  }

  // 最后发布主包
  await publishPkg(".");
}

main().catch((err) => {
  console.error("发布失败:", err);
  process.exit(1);
});
