#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve, dirname, join, relative } from "node:path";
import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import RED from "@3-/log/RED.js";
import YELLOW from "@3-/log/YELLOW.js";
import { stderr } from "node:process";
import scan from "./scan.js";
import pathCheck from "./pathCheck.js";

const load = async (dir) => {
    let cur = dir;
    for (;;) {
      const p = join(cur, ".mdcheck.js");
      if (existsSync(p)) {
        const { default: f } = await import(pathToFileURL(p).href);
        if (typeof f === "function") {
          return (abs_path) => f(relative(cur, abs_path));
        }
        break;
      }
      const parent = dirname(cur);
      if (parent === cur) {
        break;
      }
      cur = parent;
    }
    return () => false;
  },
  mdcheck = async (path) => {
    const abs_path = resolve(path || ".");
    if (!existsSync(abs_path)) {
      return [];
    }
    const stat = statSync(abs_path);
    if (stat.isDirectory()) {
      const filter = await load(abs_path);
      return scan(abs_path, filter);
    }
    const file_dir = dirname(abs_path),
      filter = await load(file_dir);
    if (filter(abs_path)) {
      return [];
    }
    const err = await pathCheck(abs_path);
    return err.length ? [[relative(file_dir, abs_path), err]] : [];
  };

if (import.meta.main) {
  const args = (await yargs(hideBin(process.argv)).usage("Usage: $0 [dir]").help()).argv,
    path = args._[0] || ".",
    err_li = await mdcheck(path);

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
}

export default mdcheck;
