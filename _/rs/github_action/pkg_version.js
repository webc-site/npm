#!/usr/bin/env bun
import read from "@3-/read";
import path from "path";

const dir = process.argv[2] || ".",
  pkg = JSON.parse(read(path.join(dir, "package.json")));
console.log(pkg.version);
