import { parseSync } from "oxc-parser";
import { format } from "oxfmt";
import constMerge from "./constMerge.js";
import readReplace from "./readReplace.js";
import sleepReplace from "./sleepReplace.js";

const RULES = [readReplace, sleepReplace, constMerge];

export default async (js, filename = ".js") => {
  let code = js,
    ast = parseSync(filename, code);

  for (const rule of RULES) {
    const next_code = rule(code, ast);
    if (next_code !== code) {
      code = next_code;
      ast = parseSync(filename, code);
    }
  }

  const res = await format(filename, code);
  if (res.code !== js) {
    return res.code;
  }
};
