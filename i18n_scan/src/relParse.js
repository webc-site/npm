import { sep } from "node:path";

const collect = (prefix, from_set, base, dir, from, to_sets, to_li, files, relations) => {
  for (const rel of from_set) {
    const from_path = base + dir + sep + from + sep + rel,
      to_lang_li = [];

    files.push(from_path);

    for (let i = 0; i < to_sets.length; ++i) {
      const to_set = to_sets[i],
        to_lang = to_li[i];
      if (to_set?.has(rel)) {
        files.push(base + dir + sep + to_lang + sep + rel);
        to_lang_li.push(to_lang);
      }
    }

    relations.push([prefix, rel, from_path, to_lang_li]);
  }
};

/*
解析关系并收集文件路径
res_li: 扫描到的物理文件映射结构
from: 源语言
to_li: 目标语言列表
返回值: [所有文件路径数组, 关系对象数组]
*/
export default (res_li, from, to_li, dir_li) => {
  const files = [],
    relations = [];

  for (const [from_map, to_maps] of res_li) {
    for (const [prefix, from_set] of from_map) {
      const dir = dir_li.find((d) => prefix === d || prefix.endsWith(sep + d)),
        base = prefix.slice(0, prefix.length - dir.length),
        to_sets = to_maps.map((to_map) => to_map.get(prefix));

      collect(prefix, from_set, base, dir, from, to_sets, to_li, files, relations);
    }
  }
  return [files, relations];
};
