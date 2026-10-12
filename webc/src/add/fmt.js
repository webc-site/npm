import fmtStyl from "@1-/stylus/fmt.js";
import parseStyl from "@1-/stylus/parse.js";
import { format } from "oxfmt";

export default async (name, code) => {
  if (name.endsWith(".styl")) {
    try {
      return fmtStyl(parseStyl(code));
    } catch {
      return code;
    }
  }
  return (await format(name, code).catch(() => null))?.code || code;
};
