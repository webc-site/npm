#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve, dirname, join, relative } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import RED from "@3-/log/RED.js";
import YELLOW from "@3-/log/YELLOW.js";
import scan from "./scan.js";
import { stderr } from "node:process";

const args = (await yargs(hideBin(process.argv)).usage("Usage: $0 [dir]").help()).argv,
  dir = resolve(args._[0] || ".");

let filter,
  cur = dir;
for (;;) {
  const p = join(cur, ".mdcheck.js");
  if (existsSync(p)) {
    const { default: f } = await import(pathToFileURL(p).href);
    if (typeof f === "function") {
      const base_dir = cur;
      filter = (abs_path) => f(relative(base_dir, abs_path));
    }
    break;
  }
  const parent = dirname(cur);
  if (parent === cur) {
    break;
  }
  cur = parent;
}

const err_li = await scan(dir, filter);

if (err_li.length) {
  err_li.forEach(([rel_path, li], pos) => {
    YELLOW((pos ? "\n" : "") + rel_path);
    li.forEach(([line, msg]) => {
      RED("line " + line + ": " + msg);
    });
    stderr.write("\n");
  });
  process.exit(1);
}
