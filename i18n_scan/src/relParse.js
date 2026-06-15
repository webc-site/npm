import langPath from "./langPath.js";

const collect = (prefix, from_set, from, to_set_li, files, relations) => {
  let rel_map = relations.get(prefix);
  if (!rel_map) {
    relations.set(prefix, (rel_map = new Map()));
  }

  for (const rel of from_set) {
    const from_path = langPath(prefix, rel, from),
      to_lang_li = [];

    files.push(from_path);

    to_set_li.forEach(([to_lang, to_set]) => {
      if (to_set.has(rel)) {
        files.push(langPath(prefix, rel, to_lang));
        to_lang_li.push(to_lang);
      }
    });

    rel_map.set(rel, to_lang_li);
  }
};

/*
解析关系并收集文件路径
res_li: 扫描到的物理文件映射结构
from: 源语言
to_li: 目标语言列表
返回值: [所有文件路径数组, 关系对象 Map]
*/
export default (res_li, from, to_li) => {
  const files = [],
    relations = new Map();

  for (const [from_map, to_maps] of res_li) {
    for (const [prefix, from_set] of from_map) {
      const to_set_li = [];
      to_maps.forEach((to_map, i) => {
        const to_set = to_map.get(prefix);
        if (to_set) {
          to_set_li.push([to_li[i], to_set]);
        }
      });

      collect(prefix, from_set, from, to_set_li, files, relations);
    }
  }
  return [files, relations];
};
