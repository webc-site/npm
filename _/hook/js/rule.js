import { parseSync } from "oxc-parser";
import { format } from "oxfmt";
import constMerge from "./constMerge.js";
import readReplace from "./readReplace.js";
import sleepReplace from "./sleepReplace.js";
import whileReplace from "./whileReplace.js";

const RULES = [readReplace, sleepReplace, constMerge, whileReplace];

export default async (js, filename = ".js") => {
  let code = js,
    ast = parseSync(filename, code);

  for (const rule of RULES) {
    const next = rule(code, ast);
    if (next !== code) {
      code = next;
      ast = parseSync(filename, code);
    }
  }

  const res = await format(filename, code);
  if (res.code !== js) return res.code;
};
