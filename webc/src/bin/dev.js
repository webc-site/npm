import { env } from "node:process";
import { join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import runVite from "../vite.js";
import killold from "@3-/killold";
import ls from "../lib/ls.js";
import watchWebc from "../lib/watchWebc.js";
import i18nGen from "../lib/i18nGen.js";
import { parseCli } from "../cli/cli.js";

const ANY_IP = "0.0.0.0",
  LOCAL_IP = "127.0.0.1",
  WEBC_LS = "WebC.ls";
export const getArgv = (meta = import.meta) =>
  parseCli(meta, (y) =>
    y
      .usage("usage: $0 [component]")
      .positional("component", {
        describe: "component name",
        type: "string"
      })
      .option("port", {
        alias: "p",
        describe: "server port",
        type: "number",
        default: env.DEV_PORT || 8888
      })
      .option("host", {
        describe: "server host",
        type: "string",
        default: ANY_IP
      })
  ).argv;

const dev = async (root, options = {}) => {
  await killold();
  const webc_dir = join(root, "src", "webc");
  if (!existsSync(webc_dir)) {
    console.error("webc directory not found: " + webc_dir);
    return 1;
  }

  await i18nGen(root);
  await ls(root, join(root, "src", "_/ls"));
  watchWebc(root);

  const component_li = readdirSync(webc_dir)
      .filter((file) => file.endsWith(".js"))
      .map((file) => file.slice(0, -3)),
    input_name = options.component || options._?.[0] || WEBC_LS,
    input_name_lower = String(input_name).toLowerCase(),
    matched = component_li.find((c) => c.toLowerCase() === input_name_lower) || WEBC_LS,
    port = options.port || env.DEV_PORT || 8888,
    host = options.host || ANY_IP,
    open_host = host === ANY_IP ? LOCAL_IP : host;

  await runVite(root, host, port, matched, component_li, open_host);
};

export default dev;

if (import.meta.main) {
  await dev(process.cwd(), getArgv());
}
