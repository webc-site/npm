import walk from "./walk.js";
import rm from "./rm.js";
import relParse from "./relParse.js";
import tranerInit from "./traner.js";
import scan from "@1-/scan";
import initBar from "./bar.js";
import tranLiGen from "./tranLiGen.js";
import runUpsert from "./runUpsert.js";

/*
扫描物理文件，清理冗余，增量扫描并构建最终的翻译状态树
root: 项目根目录
db_path: 状态数据库路径
from: 源语言代码
to_li: 目标语言代码列表
update_cache: 译文缓存更新回调，签名 (prefix, rel, from_lang, to_lang, log) => Promise/void
tran: 翻译函数，签名 (prefix, rel, from_lang, to_lang, log) => Promise/void
conf_li: 配置项目列表，格式为 [[OPT_DIR, dir_li], [OPT_EXT, ext_li]]，可选
*/
export const OPT_DIR = 0,
  OPT_EXT = 1;

const run = async (to_tran_map, tran, bar, total_tran) => {
  if (total_tran > 0) {
    bar.start(total_tran, 0);
    try {
      for (const [prefix, rel_map] of to_tran_map) {
        for (const rel of rel_map.keys()) {
          await tran(prefix, rel);
        }
      }
    } finally {
      bar.stop();
    }
  }
};

export default async (root, db_path, from, to_li, update_cache, tran, conf_li = []) => {
  let i18n_dir_name_li = ["doc", "docs", "i18n"], // 翻译文件所在目录列表
    ext_li = ["md", "yml"]; // 翻译文件后缀列表

  conf_li.forEach(([key, val]) => {
    if (key === OPT_DIR) i18n_dir_name_li = val;
    if (key === OPT_EXT) ext_li = val;
  });

  const [bar, log, barIncr] = initBar(),
    res_li = await walk(root, from, to_li, i18n_dir_name_li, ext_li);

  await rm(res_li, root, to_li, i18n_dir_name_li);

  const [files, relations] = relParse(res_li, from, to_li),
    [update, upsert] = await scan(root, db_path, files);

  using _ = upsert;

  const update_set = new Set(update),
    runCache = runUpsert.bind(null, update_cache, from, upsert, log),
    runTran = runUpsert.bind(null, tran, from, upsert, log),
    [to_tran_map, total_tran] = await tranLiGen(runCache, update_set, from, to_li, relations),
    tranFile = tranerInit(runTran, from, to_tran_map, upsert, barIncr);

  await run(to_tran_map, tranFile, bar, total_tran);
};
