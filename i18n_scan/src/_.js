import tranerInit from "./traner.js";
import barInit from "./bar.js";
import tranLiGen from "./tranLiGen.js";
import scan from "./scan.js";
import run from "./run.js";
import exec from "./exec.js";

/*
扫描物理文件，清理冗余，增量扫描并构建最终的翻译状态树
root: 项目根目录
db_dir: 状态数据库路径
from: 源语言代码
to_li: 目标语言代码列表
updateCache: 译文缓存更新回调，签名 (ext, from_lang, to_lang, txt, src_md5, log) => Promise/void
tran: 翻译函数，签名 (ext, from_lang, to_lang, txt, log) => Promise/void
i18n_dir_name_li: 翻译文件所在目录列表，可选
ext_li: 翻译文件后缀列表，可选
*/
export default async (
  root,
  db_dir,
  from,
  to_li,
  updateCache,
  tran,
  i18n_dir_name_li = ["doc", "docs", "i18n"],
  ext_li = ["md", "yml"],
) => {
  const [bar, log, barIncr] = barInit(),
    [relations, update, upsert, traned_path_src_txt_md5] = await scan(
      root,
      db_dir,
      from,
      to_li,
      i18n_dir_name_li,
      ext_li,
    );

  using _upsert = upsert;

  const update_set = new Set(update),
    [runCache, runTran] = exec(traned_path_src_txt_md5, log, upsert, updateCache, tran, from),
    [to_tran_map, total_tran] = await tranLiGen(runCache, update_set, from, to_li, relations),
    tran_file = tranerInit(runTran, from, to_tran_map, upsert, barIncr);

  await run(to_tran_map, tran_file, bar, total_tran);
};
