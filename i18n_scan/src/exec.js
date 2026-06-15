import { sep } from "node:path";
import ext from "@3-/ext";
import WARN from "@3-/log/WARN.js";
import ok from "./ok.js";

/*
初始化并构建翻译和缓存更新的回调执行器
traned_path_src_txt_md5: 目标译文路径至源文件文本及MD5的映射 Map
log: 日志输出函数
upsert: 数据库写入与更新函数
updateCache: 译文缓存更新回调
tran: 翻译接口回调
from: 源语言代码

返回值:
[run_cache, run_tran] 缓存更新器与翻译器函数数组
*/
export default (traned_path_src_txt_md5, log, upsert, updateCache, tran, from) => {
  const exec = (action) => async (prefix, rel, to_lang, to_path) => {
    const info = traned_path_src_txt_md5.get(to_path);
    if (!info) {
      WARN("missing src md5 " + to_path);
      return 0;
    }
    const res = await ok(action(info, prefix, rel, to_lang, to_path));
    if (res === 1) {
      return 1;
    }
    log("❌ " + prefix + sep + to_lang + sep + rel + ": " + res.message);
    return 0;
  };

  return [
    exec(async ([from_txt, from_md5], prefix, rel, to_lang, to_path) => {
      await updateCache(ext(rel), from, to_lang, from_txt, from_md5, log);
      await upsert(to_path);
    }),
    exec(async ([from_txt, from_md5], prefix, rel, to_lang, to_path) => {
      const to_txt = await tran(ext(rel), from, to_lang, from_txt, log);
      if (to_txt !== undefined) {
        await upsert(to_path, [to_txt, from_md5]);
      }
    }),
  ];
};
