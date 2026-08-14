import { join } from "node:path";
import read from "@3-/read";
import { load } from "js-yaml";
import scan from "@1-/i18n_scan";
import CODE from "@3-/lang/CODE.js";
import ERR from "@3-/log/ERR.js";
import WARN from "@3-/log/WARN.js";
import reqTxt from "@3-/req/reqTxt.js";
import limit from "./limit.js";
import { API, TOKEN } from "./conf.js";
import toLi from "./toLi.js";

/*
  prefix 路径前缀, rel 相对路径, lang 语言
  返回 目标语言文件路径
  */
const toPath = (prefix, rel, lang) => prefix + "/" + lang + "/" + rel,
  /*
  lang 语言代码
  返回 语言在 CODE 中的索引
  */
  id = (lang) => {
    const r = CODE.indexOf(lang);
    if (r < 0) {
      ERR("unknown lang " + lang);
    }
    return r;
  },
  /*
  url 接口地址, token 鉴权令牌, data 发送数据
  返回 响应文本
  */
  post = (url, token, data) =>
    reqTxt(url, {
      method: "POST",
      headers: {
        token
      },
      body: JSON.stringify(data),
      timeout: 1e5
    });

/*
root_dir 项目根路径
核心流程: 加载配置文件，初始化缓存与限制器，扫描并翻译文件，更新翻译缓存
*/
export default async (root_dir) => {
  if (!TOKEN) {
    ERR("env WEBC_TOKEN missing");
    process.exit(1);
  }

  let cache_n = 0,
    tran_n = 0;

  const yml_path = join(root_dir, "tran.yml"),
    {
      tran: { from, to_li: to_li_raw },
      dir
    } = load(read(yml_path)),
    to_li = toLi(to_li_raw).filter((x) => x !== from),
    db_dir = join(root_dir, ".cache/scan/tran"),
    api = API + "tran",
    /*
    prefix 路径前缀, rel 相对路径, from_lang 源语言, to_lang 目标语言, to_txt 翻译后文本, src_id 翻译源ID, log 日志函数
    更新远程翻译缓存
    */
    cache = async (prefix, rel, from_lang, to_lang, to_txt, src_id, log) => {
      const from_id = id(from_lang),
        to_id = id(to_lang);
      if (from_id >= 0 && to_id >= 0) {
        const to_path = toPath(prefix, rel, to_lang);
        await limit(async () => {
          log("update cache", [prefix, to_lang, rel].join("/"));
          ++cache_n;
          const err = await post(api + "/update", TOKEN, [
            from_id,
            to_id,
            toPath(prefix, rel, from_lang),
            to_txt,
            src_id
          ]);
          if (err) {
            WARN(to_path + " update cache err: " + err);
          }
        });
      }
    },
    /*
    prefix 路径前缀, rel 相对路径, from_lang 源语言, to_lang 目标语言, txt 待翻译文本, log 日志函数
    请求远程接口进行文本翻译，返回翻译结果
    */
    tran = async (prefix, rel, from_lang, to_lang, txt, log) => {
      const from_id = id(from_lang),
        to_id = id(to_lang);
      if (from_id >= 0 && to_id >= 0) {
        return JSON.parse(
          await limit(async () => {
            log([prefix, from_lang, rel].join("/"), "→", to_lang);
            ++tran_n;
            return post(api, TOKEN, [from_id, to_id, toPath(prefix, rel, from_lang), txt]);
          })
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
