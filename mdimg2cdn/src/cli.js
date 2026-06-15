#!/usr/bin/env bun

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import read from "@1-/read";
import findgit from "@1-/findgit";
import githubCdn from "@1-/github_cdn";
import mdimg2cdn from "./_.js";

const y = yargs(hideBin(process.argv))
    .usage("Usage: $0 <file> [options]")
    .option("w", {
      alias: "write",
      type: "boolean",
      description: "Write the changes back to the file",
      default: false,
    })
    .help("h")
    .alias("h", "help"),
  argv = y.argv,
  file_path = argv._[0];

if (!file_path) {
  y.showHelp();
  process.exit(1);
}

const abs_file = resolve(process.cwd(), file_path),
  git_dir = findgit(abs_file),
  load = (dir) => async (path) => (await import(resolve(dir, "conf", path))).default,
  conf = load(git_dir),
  token = await conf("github.js"),
  repo = await conf("github/FS.js"),
  upload = githubCdn(token, repo),
  base_dir = dirname(abs_file),
  content = await read(abs_file),
  result = await mdimg2cdn(content, upload, base_dir);

if (argv.w) {
  await writeFile(abs_file, result, "utf8");
} else {
  process.stdout.write(result);
}
