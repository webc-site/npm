import { basename } from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import i18n from "./i18n.js";

export const CLI_I18N = i18n(import.meta),
  parseCli = (meta, configure) => {
    const name = meta.filename,
      cmd_name = basename(name, ".js"),
      _ = i18n(meta),
      desc = CLI_I18N[cmd_name] || "";

    let y = yargs(hideBin(process.argv))
      .scriptName(cmd_name)
      .usage(desc ? "$0 - " + desc : "$0")
      .help("h")
      .alias("h", "help");

    if (configure) {
      y = configure(y, _);
    }

    return { argv: y.parse(), _, desc };
  };
