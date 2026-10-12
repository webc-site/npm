#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import run from "./run.js";
import ERR from "@3-/log/ERR.js";
import findgit from "@1-/findgit";
import { resolve } from "node:path";

// 使用 yargs 解析位置参数
const { pkg: pkg_folder } = yargs(hideBin(process.argv))
  .command("$0 <pkg>", "发布指定的包", (yargs) => {
    yargs.positional("pkg", {
      describe: "要发布的包目录名称 (例如: walk)",
      type: "string"
    });
  })
  .help()
  .parseSync();

if (!pkg_folder) {
  ERR("请指定包目录");
  process.exit(1);
}

const git_dir = findgit(resolve(pkg_folder));
await run(git_dir, pkg_folder, "src");
process.exit(0);
