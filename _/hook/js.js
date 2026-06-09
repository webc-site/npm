#!/usr/bin/env bun

import yargs from "yargs";
import run from "./js/run.js";

if (import.meta.main) {
  const { _ } = yargs(process.argv.slice(2)).parse();
  if (_.length) await run(_);
}
