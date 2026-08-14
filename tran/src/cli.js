#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import tran from "./_.js";

const { dir } = yargs(hideBin(process.argv))
  .option("dir", {
    alias: "d",
    type: "string",
    description: "working directory",
    default: process.cwd()
  })
  .help().argv;

await tran(dir);
