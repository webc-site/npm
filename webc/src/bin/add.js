#!/usr/bin/env node
import ERR from "@3-/log/ERR.js";
import add from "../add/add.js";
import { parseCli } from "../cli/cli.js";
import webcDir from "../lib/webcDir.js";

export const getArgv = (meta = import.meta) =>
  parseCli(meta, (y) =>
    y.usage("usage: $0 <name>").positional("name", {
      describe: "component name or specifier",
      type: "string"
    })
  ).argv;

const addCmd = async (root, options = {}) => {
  const raw_name = options.name || options._?.[0];
  if (!raw_name) {
    ERR("usage: add <name>");
    return 1;
  }
  const webc_dir = webcDir(root);
  if (!webc_dir) return 1;

  const ok = await add(webc_dir, raw_name);
  return ok ? 0 : 1;
};

export default addCmd;
if (import.meta.main) {
  const code = await addCmd(process.cwd(), getArgv());
  if (code) process.exit(code);
}
