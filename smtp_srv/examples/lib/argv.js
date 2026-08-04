import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const { _ } = yargs(hideBin(process.argv))
    .usage("用法: $0 <域名>")
    .demandCommand(1, "请指定域名")
    .help().argv,
  domain = _[0].trim().toLowerCase();

export default domain;
