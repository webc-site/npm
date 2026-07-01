import { join } from "node:path";
import read from "@3-/read";
import { load } from "js-yaml";
import scan from "@1-/i18n_scan";
import CODE from "@3-/lang/CODE.js";
import ERR from "@3-/log/ERR.js";
import WARN from "@3-/log/WARN.js";
import reqTxt from "@3-/req/reqTxt.js";
import { API, TOKEN } from "./conf.js";
import toLi from "./toLi.js";

const toPath = (prefix, rel, lang) => prefix + "/" + lang + "/" + rel,
  langId = (lang) => {
    const id = CODE.indexOf(lang);
    if (id < 0) {
      ERR("unknown lang " + lang);
    }
    return id;
  },
  post = async (url, token, data) =>
    await reqTxt(url, {
      method: "POST",
      headers: {
        token,
      },
      body: JSON.stringify(data),
      timeout: 1e5,
    });

export default async (root_dir) => {
  if (!TOKEN) {
    ERR("env WEBC_TOKEN missing");
    process.exit(1);
  }

  const yml_path = join(root_dir, "tran.yml"),
    conf = load(read(yml_path)),
    { tran: tran_conf, dir } = conf,
    { from, to_li: to_li_raw } = tran_conf,
    to_li = toLi(to_li_raw).filter((x) => x !== from);

  let cache_n = 0,
    tran_n = 0;

  const db_dir = join(root_dir, ".cache/scan/tran"),
    api = API + "tran",
    cache = async (prefix, rel, from_lang, to_lang, to_txt, src_id, log) => {
      log("update cache", [prefix, to_lang, rel].join("/"));
      ++cache_n;
      const from_id = langId(from_lang),
        to_id = langId(to_lang);
      if (from_id >= 0 && to_id >= 0) {
        const to_path = toPath(prefix, rel, to_lang),
          err = await post(api + "/update", TOKEN, [
            from_id,
            to_id,
            toPath(prefix, rel, from_lang),
            to_txt,
            src_id,
          ]);
        if (err) {
          WARN(to_path + " update cache err: " + err);
        }
      }
    },
    tran = async (prefix, rel, from_lang, to_lang, txt, log) => {
      ++tran_n;
      log([prefix, from_lang, rel].join("/"), "→", to_lang);
      const from_id = langId(from_lang),
        to_id = langId(to_lang);
      if (from_id >= 0 && to_id >= 0) {
        return JSON.parse(
          await post(api, TOKEN, [from_id, to_id, toPath(prefix, rel, from_lang), txt]),
        );
      }
    };

  await scan(root_dir, db_dir, from, to_li, cache, tran, dir, ["md", "yml"]);

  let tip = "tran " + tran_n;
  if (cache_n) {
    tip += ", update cache " + cache_n;
  }

  console.log(tip);
};
