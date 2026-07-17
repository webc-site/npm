import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve } from "node:path";

const argv = yargs(hideBin(process.argv))
    .usage("Usage: $0 <PROJECT>")
    .demandCommand(1, "PROJECT is required")
    .parseSync(),
  project = argv._[0].toString(),
  ROOT = resolve(import.meta.dirname, "../../..", project);

export { project, ROOT };
