#!/usr/bin/env bun
import build from "./build.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { env } from "process";

env.NODE_ENV = "production";

const argv = yargs(hideBin(process.argv))
    .option("platform", {
      type: "string",
      description: "Target platform",
    })
    .option("target", {
      type: "string",
      description: "Cargo target",
    })
    .option("cross-compile", {
      type: "boolean",
      description: "Enable cross compilation",
    })
    .help()
    .alias("h", "help")
    .parseSync(),
  args = ["--release"];

if (argv.target) {
  args.push("--target", argv.target);
}

if (argv.crossCompile || argv["cross-compile"]) {
  args.push("--cross-compile");
}

await build(argv.platform || env.PLATFORM, args);
