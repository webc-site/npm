#!/usr/bin/env bun
import read from "@3-/read";
import fs from "fs";
import path from "path";

const dir = ".",
  version = process.argv[2];
if (!version) {
  console.error("未提供版本号");
  process.exit(1);
}

const pkgPath = path.join(dir, "package.json"),
  pkg = JSON.parse(read(pkgPath));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
