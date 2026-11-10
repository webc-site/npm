#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import read from "@3-/read";
import { CLI_I18N } from "../cli/cli.js";

const ver = () => {
    let dir = import.meta.dirname;
    while (dir) {
      const pkg_file = join(dir, "package.json");
      if (existsSync(pkg_file)) {
        try {
          const pkg = JSON.parse(read(pkg_file));
          if (pkg.version) return pkg.version;
        } catch {}
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return "";
  },
  pwd = () => {
    const cwd = process.cwd();
    let dir = cwd;
    while (dir) {
      if (existsSync(join(dir, "src/webc"))) return dir;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return cwd;
  },
  BIN_DIR = import.meta.dirname,
  file_li = readdirSync(BIN_DIR).filter((f) => f.endsWith(".js") && basename(f, ".js") !== "webc");

let y = yargs(hideBin(process.argv))
  .scriptName("webc")
  .usage("Usage: webc <command> [options]")
  .version(ver())
  .alias("v", "version")
  .demandCommand(1, "Please specify a command")
  .help("h")
  .alias("h", "help")
  .strict();

for (const file of file_li) {
  const cmd_name = basename(file, ".js"),
    desc = CLI_I18N[cmd_name] ?? cmd_name;

  y = y.command(
    cmd_name,
    desc,
    (y) => y.help(false).strict(false),
    async () => {
      const file_path = join(BIN_DIR, file),
        idx = process.argv.indexOf(cmd_name);
      if (idx !== -1) {
        process.argv.splice(1, idx, file_path);
      }
      const mod = await import(file_path),
        options = mod.getArgv ? mod.getArgv() : undefined;
      await mod.default(pwd(), options);
    }
  );
}

if (import.meta.main) y.parse();
