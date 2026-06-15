import langPath from "./langPath.js";

/*
根据更新状态与文件关联关系，过滤并生成待翻译的任务列表，并在扫描时更新被修改的译文缓存
update_set: 发生更新的文件路径集合 (Set<string>)
relations: 文件关联关系 (Map<prefix, Map<rel, Array<to_lang>>>)
from: 源语言 (string)
to_li: 目标语言列表 (Array<string>)
runCache: 更新缓存回调函数
返回值：Map<prefix, Map<rel, Array<to_lang>>> (待翻译任务 Map)
*/
const check = async (update_set, prefix, rel, to_lang_li, from_path, to_li, runCache) => {
  const tran_li = [],
    from_updated = update_set.has(from_path);

  for (const to_lang of to_li) {
    const has_lang = to_lang_li.includes(to_lang);
    if (has_lang) {
      const to_path = langPath(prefix, rel, to_lang);
      if (update_set.has(to_path)) {
        await runCache(prefix, rel, to_lang, to_path);
      }
    }
    if (!has_lang || from_updated) {
      tran_li.push(to_lang);
    }
  }
  return tran_li;
};

/*
根据更新状态与文件关联关系，过滤并生成待翻译的任务列表，并在扫描时更新被修改 of 译文缓存
runCache: 更新缓存回调函数
update_set: 发生更新的文件路径集合 (Set<string>)
from: 源语言 (string)
to_li: 目标语言列表 (Array<string>)
relations: 文件关联关系 (Map<prefix, Map<rel, Array<to_lang>>>)
返回值：[Map<prefix, Map<rel, Array<to_lang>>>, number] (待翻译任务 Map, 翻译总数)
*/
export default async (runCache, update_set, from, to_li, relations) => {
  const to_tran_map = new Map();
  let total = 0;

  for (const [prefix, rel_map] of relations) {
    for (const [rel, to_lang_li] of rel_map) {
      const from_path = langPath(prefix, rel, from),
        tran_li = await check(update_set, prefix, rel, to_lang_li, from_path, to_li, runCache),
        len = tran_li.length;

      if (len > 0) {
        let map = to_tran_map.get(prefix);
        if (!map) {
          to_tran_map.set(prefix, (map = new Map()));
        }
        map.set(rel, tran_li);
        total += len;
      }
    }
  }

  return [to_tran_map, total];
};
