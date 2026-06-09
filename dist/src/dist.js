#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import run from "./run.js";
import ERR from "@3-/log/ERR.js";

// 1. 使用 yargs 解析位置参数
const argv = yargs(hideBin(process.argv))
    .command("$0 <pkg>", "发布指定的包", (yargs) => {
      yargs.positional("pkg", {
        describe: "要发布的包目录名称 (例如: walk)",
        type: "string",
      });
    })
    .help()
    .parseSync(),
  pkg_folder = argv.pkg;

if (!pkg_folder) {
  ERR("请指定包目录");
  process.exit(1);
}

await run(pkg_folder);
