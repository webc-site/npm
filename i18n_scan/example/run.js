#!/usr/bin/env bun
import { env } from "node:process";
import { join } from "node:path";
import scan from "../src/_.js";
import CODE from "@3-/lang/CODE.js";
import ERR from "@3-/log/ERR.js";
import WARN from "@3-/log/WARN.js";
import reqTxt from "@3-/req/reqTxt.js";

let cache_n = 0,
  tran_n = 0;

const ROOT = import.meta.dirname,
  root = join(ROOT, "../../../webc.site"),
  langPath = (prefix, rel, lang) => prefix + "/" + lang + "/" + rel,
  langId = (lang) => {
    let id = CODE.indexOf(lang);
    if (id < 0) ERR("unknown lang " + lang);
    return id;
  },
  { WEBC_API, WEBC_TOKEN } = env,
  API = WEBC_API + "tran",
  post = async (url, data) =>
    await reqTxt(url, {
      method: "POST",
      headers: {
        token: WEBC_TOKEN,
      },
      body: JSON.stringify(data),
      timeout: 1e5,
    }),
  updateCache = async (prefix, rel, from, to_lang, to_txt, src_id, log) => {
    ++cache_n;
    let from_id = langId(from),
      to_id = langId(to_lang);
    if (from_id >= 0 && to_id >= 0) {
      let to_path = langPath(prefix, rel, to_lang),
        data = [from_id, to_id, langPath(prefix, rel, from), to_txt, src_id];
      log("updateCache", data);
      let err = await post(API + "/update", data);
      if (err) WARN(to_path + " update cache err: " + err);
    }
  },
  tran = async (prefix, rel, from_lang, to_lang, txt, log) => {
    ++tran_n;
    log(from_lang, "→", to_lang, prefix, rel);
    let from_id = langId(from_lang),
      to_id = langId(to_lang);
    if (from_id >= 0 && to_id >= 0) {
      let data = [from_id, to_id, langPath(prefix, rel, from_lang), txt];
      log("tran", data);
      return JSON.parse(await post(API, data));
    }
  };

await scan(
  root,
  join(root, ".cache/scan/tran"),
  "zh",
  ["en"],
  updateCache,
  tran,
  ["doc", "docs", "i18n"],
  ["md", "yml"],
);

console.log("update cache ", cache_n, "tran ", tran_n);
