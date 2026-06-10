import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import { FILE } from "@1-/walk";
import ext from "@3-/ext";
import { sep } from "node:path";

const save = (map, prefix, rel) => {
    const set = map.get(prefix);
    if (set) {
      set.add(rel);
    } else {
      map.set(prefix, new Set([rel]));
    }
  },
  /*
  匹配并解析翻译文件路径，归入对应的语言 Map 中
  rel_path: 相对路径
  lang_to_idx: 目标语言到索引的映射
  from: 源语言
  res_li: 结果列表结构
  */
  match = (rel_path, lang_to_idx, from, res_li, dir_li, ext_li) => {
    const pos = ext_li.indexOf(ext(rel_path));
    if (pos < 0) {
      return;
    }
    const parts = rel_path.split(sep);
    for (let i = 0; i < parts.length - 2; ++i) {
      const part = parts[i];
      // 定位 i18n 目录根节点
      if (dir_li.includes(part)) {
        const next_part = parts[i + 1];
        let lang_pos = -1;
        // 区分源语言与目标语言
        if (next_part === from) {
          lang_pos = 0;
        } else {
          const idx = lang_to_idx.get(next_part);
          if (idx !== undefined) {
            lang_pos = idx + 1;
          }
        }
        if (lang_pos >= 0) {
          const prefix = parts.slice(0, i + 1).join(sep),
            rel = parts.slice(i + 2).join(sep),
            [from_map, to_maps] = res_li[pos],
            map = lang_pos === 0 ? from_map : to_maps[lang_pos - 1];
          save(map, prefix, rel);
          break;
        }
      }
    }
  };

/*
遍历根目录，寻找匹配的源和目标翻译文件
root: 项目根目录
from: 源语言代码
to_li: 目标语言代码列表
返回值: 匹配到的文件分类映射列表
*/
export default async (root, from, to_li, dir_li, ext_li) => {
  const res_li = ext_li.map(() => [new Map(), to_li.map(() => new Map())]),
    lang_to_idx = new Map(to_li.map((lang, idx) => [lang, idx]));

  await walkRelIgnore(root, (kind, rel_path) => {
    if (kind === FILE) {
      match(rel_path, lang_to_idx, from, res_li, dir_li, ext_li);
    }
  });

  return res_li;
};
