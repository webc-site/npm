#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import minify from "./_.js";

// 解析参数并压缩指定目录下所有 JS 文件
const { dir } = yargs(hideBin(process.argv))
  .usage("Usage: $0 <dir>")
  .command("$0 <dir>", "minify js and show brotli size", (y) => {
    y.positional("dir", {
      describe: "directory to minify",
      type: "string",
    });
  })
  .demandCommand(1, "You must specify a directory")
  .help()
  .alias("h", "help").argv;

await minify(dir);
