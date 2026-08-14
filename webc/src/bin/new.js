import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import ERR from "@3-/log/ERR.js";
import write from "@3-/write";
import { parseCli } from "../cli/cli.js";

export const getArgv = (meta = import.meta) =>
  parseCli(meta, (y) =>
    y
      .usage("usage: $0 <type> <name>")
      .positional("type", {
        describe: 'component type ("css" or "js")',
        type: "string",
        choices: ["css", "js"]
      })
      .positional("name", {
        describe: "component name",
        type: "string"
      })
  ).argv;

const newCmd = (root) => {
  let [type, name] = getArgv()._;

  if (!type || !name) {
    ERR("usage: new <type> <name>");
    return 1;
  }

  name = name.charAt(0).toUpperCase() + name.slice(1);

  if (!/^[A-Z0-9]/.test(name)) {
    ERR("component name must start with a letter or a digit");
    return 1;
  }

  const workspace_root = root || process.cwd(),
    src_dir = join(workspace_root, "src"),
    webc_dir = join(src_dir, "webc"),
    tmpl_dir = join(src_dir, "tmpl"),
    comp_dir = join(webc_dir, name),
    js_file = join(webc_dir, name + ".js");

  if (existsSync(comp_dir) || existsSync(js_file)) {
    ERR('component "' + name + '" already exists');
    return 1;
  }

  cpSync(tmpl_dir, comp_dir, { recursive: true });
  write(js_file, 'import "./' + name + '/_.styl";\n');
  console.log("successfully created " + type + " component: src/webc/" + name + ".js");
};

export default newCmd;

if (import.meta.main) {
  const code = newCmd(process.cwd(), getArgv());
  if (code) process.exit(code);
}
