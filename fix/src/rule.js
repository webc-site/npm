import { parse, langFromPath, sourceTypeFromPath } from "yuku-parser";
import { format } from "oxfmt";
import constMerge from "./replace/constMerge.js";
import env from "./replace/env.js";
import read from "./replace/read.js";
import readAsync from "./replace/readAsync.js";
import sleep from "./replace/sleep.js";
import utf8e from "./replace/utf8e.js";
import while_ from "./replace/while.js";

const RULES = [read, readAsync, sleep, constMerge, while_, utf8e, env],
  parseSync = (filename, code) =>
    parse(code, {
      lang: langFromPath(filename),
      source_type: sourceTypeFromPath(filename)
    });

export default async (js, filename = "_.js") => {
  let code = js,
    ast = parseSync(filename, code);

  for (const rule of RULES) {
    const next = rule(code, ast);
    if (next !== code) {
      code = next;
      ast = parseSync(filename, code);
    }
  }

  const res = await format(filename, code, { trailingComma: "none" });
  if (res.code !== js) return res.code;
};
