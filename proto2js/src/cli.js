#!/usr/bin/env bun

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import ERR from "@3-/log/ERR.js";
import gen from "./_.js";

const { include, out, proto_path } = yargs(hideBin(process.argv))
  .scriptName("proto2js")
  .usage("$0 <proto_path> [-o <out_dir>] [-I <include_dir>]")
  .command("$0 <proto_path>", "Generate JavaScript from a .proto file or directory", (y) =>
    y.positional("proto_path", {
      describe: "Path to the .proto file or directory",
      type: "string"
    })
  )
  .option("out", {
    alias: "o",
    describe: "Output directory for generated files",
    type: "string"
  })
  .option("include", {
    alias: "I",
    describe: "Include directory for proto imports. Can be specified multiple times.",
    type: "array"
  })
  .help().argv;

try {
  gen(proto_path, out, include);
} catch (e) {
  ERR(e);
  process.exit(1);
}
