import langPath from "./langPath.js";
/*
初始化文件翻译同步处理函数
runTran: 执行翻译的回调函数
from: 源语言代码
to_tran_map: 待翻译任务映射 Map
upsert: 数据库更新函数
barIncr: 进度自增回调
*/
export default (runTran, from, to_tran_map, upsert, barIncr) => async (prefix, rel) => {
  const tran_li = to_tran_map.get(prefix).get(rel);
  let ok = 1;
  for (const to_lang of tran_li) {
    const to_path = langPath(prefix, rel, to_lang);
    if (!(await runTran(prefix, rel, to_lang, to_path))) {
      ok = 0;
    }
    barIncr();
  }

  if (ok) {
    await upsert(langPath(prefix, rel, from));
  }
};
