#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import minify from "./_.js";

// 解析参数并压缩指定目录或 JS 文件
const { path } = yargs(hideBin(process.argv))
  .usage("Usage: $0 <path>")
  .command("$0 <path>", "minify js and show brotli size", (y) => {
    y.positional("path", {
      describe: "directory or file path to minify",
      type: "string"
    });
  })
  .demandCommand(1, "You must specify a directory or file path")
  .help()
  .alias("h", "help").argv;

process.stdout.write((await minify(path)) + "\n");
