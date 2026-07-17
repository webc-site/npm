import langPath from "./langPath.js";

/*
根据更新状态与文件关联关系，过滤并生成待翻译和待缓存同步的任务列表
update_set: 发生更新的文件路径集合 (Set<string>)
from: 源语言 (string)
to_li: 目标语言列表 (Array<string>)
relations: 文件关联关系 (Map<prefix, Map<rel, Array<to_lang>>>)
返回值：[to_tran_map, cache_tasks, total_tran]
*/
const check = (update_set, prefix, rel, to_lang_li, from_path, to_li) => {
  const tran_li = [],
    cache_li = [],
    from_updated = update_set.has(from_path);

  for (const to_lang of to_li) {
    const has_lang = to_lang_li.includes(to_lang);
    if (has_lang) {
      const to_path = langPath(prefix, rel, to_lang);
      if (update_set.has(to_path)) {
        cache_li.push([prefix, rel, to_lang, to_path]);
      }
    }
    if (!has_lang || from_updated) {
      tran_li.push(to_lang);
    }
  }
  return [tran_li, cache_li];
};

export default (update_set, from, to_li, relations) => {
  const to_tran = new Map(),
    cache = [];
  let total = 0;

  for (const [prefix, rel_map] of relations) {
    for (const [rel, to_lang_li] of rel_map) {
      const from_path = langPath(prefix, rel, from),
        [tran_li, cache_li] = check(update_set, prefix, rel, to_lang_li, from_path, to_li),
        len = tran_li.length;

      if (len > 0) {
        if (!to_tran.has(prefix)) {
          to_tran.set(prefix, new Map());
        }
        to_tran.get(prefix).set(rel, tran_li);
        total += len;
      }
      if (cache_li.length > 0) {
        cache.push(...cache_li);
      }
    }
  }

  return [to_tran, cache, total];
};
