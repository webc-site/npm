#!/usr/bin/env bun
import { join } from "node:path";
import scan from "../src/_.js";

const root = join(import.meta.dirname, "../../../webc.site");

let to_li = ["en"];
let cache_n = 0,
  tran_n = 0;

const update_cache = (_prefix, _rel, _from_lang, _to_lang, _log) => {
    ++cache_n;
  },
  tran = (_prefix, _rel, _from_lang, _to_lang, _log) => {
    ++tran_n;
  };

await scan(root, join(root, ".cache/scan/test.db"), "zh", to_li, update_cache, tran);

console.log("total cache:", cache_n, "total tran:", tran_n);
