import walk from "./walk.js";
import rm from "./rm.js";
import relParse from "./relParse.js";
import syncInit from "./sync.js";
import scan from "@1-/scan";
import initBar from "./bar.js";
import totals from "./totals.js";

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

export default async (root, db_path, from, to_li, update_cache, tran, conf_li = []) => {
  let i18n_dir_name_li = ["doc", "docs", "i18n"], // 翻译文件所在目录列表
    ext_li = ["md", "yml"]; // 翻译文件后缀列表

  conf_li.forEach(([key, val]) => {
    if (key === OPT_DIR) i18n_dir_name_li = val;
    if (key === OPT_EXT) ext_li = val;
  });

  const [bar, log, onProgress] = initBar(),
    res_li = await walk(root, from, to_li, i18n_dir_name_li, ext_li);

  await rm(res_li, root, to_li, i18n_dir_name_li);

  const [files, relations] = relParse(res_li, from, to_li, i18n_dir_name_li),
    [update, upsert] = await scan(root, db_path, files);

  using _ = upsert;

  const sync = syncInit(
      from,
      to_li,
      update_cache,
      tran,
      update,
      upsert,
      i18n_dir_name_li,
      onProgress,
      relations,
      log,
    ),
    /*
  遍历关联关系：
  若源文件有更新，对所有目标语言执行翻译并更新其状态，完成后更新源文件状态。
  若源文件无更新，对已更新的译文更新缓存，对缺失的译文执行翻译并更新状态。
  */
    total_tran = totals(new Set(update), new Set(to_li), relations);
  if (total_tran > 0) {
    bar.start(total_tran, 0);
  }

  try {
    for (const relation of relations) {
      await sync(relation);
    }
  } finally {
    bar.stop();
  }
};
