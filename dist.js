#!/usr/bin/env bun
import { cd, $ } from "zx";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { existsSync } from "node:fs";
import path from "node:path";
import npmDist from "./dist/src/run.js";
import rsDist from "./_/rs/dist.js";

const ROOT = import.meta.dirname,
  argv = await yargs(hideBin(process.argv))
    .usage("Usage: $0 <PROJECT>")
    .demandCommand(1, "PROJECT is required")
    .help().argv,
  project = argv._[0].toString();

cd(ROOT);
$.verbose = true;

if (existsSync(path.join(project, "Cargo.toml"))) {
  await rsDist(project);
} else {
  await npmDist(ROOT, project);
  await $`./_/upgrade.sh`;
}
