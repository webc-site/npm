#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import write from "@3-/write";
import ERR from "@3-/log/ERR.js";
import lint from "./_.js";

const argv = yargs(hideBin(process.argv))
    .usage("Usage: format <file...>")
    .demandCommand(1)
    .help().argv,
  files = argv._,
  run = async (fp) => {
    try {
      const res = await lint(fp);
      if (res !== undefined) {
        write(fp, res);
      }
    } catch (e) {
      ERR(e);
      process.exit(1);
    }
  };

for (const fp of files) {
  await run(fp);
}
