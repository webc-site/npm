#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import yargs from "yargs/yargs";
import RED from "@3-/log/RED.js";
import WARN from "@3-/log/WARN.js";
import newProj from "./_.js";

const [name] = (await yargs(process.argv.slice(2)).usage("Usage: $0 <PROJECT>").help()).argv._;

if (!name) {
  RED("new <PROJECT>");
  process.exit(1);
}

const dst = resolve(name);

if (existsSync(dst)) {
  WARN(name + " EXIST");
  process.exit(1);
}

await newProj(dst, name);
