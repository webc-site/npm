import { join } from "node:path";
import { existsSync } from "node:fs";
import read from "@1-/read";
import langPath from "./langPath.js";

/*
对比并收集待翻译或重新翻译的译文目标文件信息

参数:
root: 项目根目录
from: 源语言类型
to_li: 目标语言类型列表
relations: 语言关系映射
update_set: 发生更新的源文件集合
id_map: 已存在译文的 id 映射

返回值:
traned_path_src_txt_id: 目标译文路径至其源文件内容及 id 的映射
*/
const init = (id_map) =>
    new Map(Array.from(id_map, ([to_path, src_id]) => [to_path, [undefined, src_id]])),
  collect = async (prefix, rel, to_lang_li, from, to_li, update_set, tran_map, load) => {
    const from_path = langPath(prefix, rel, from),
      is_from_updated = update_set.has(from_path);

    let txt;
    for (const to_lang of to_li) {
      const to_path = langPath(prefix, rel, to_lang),
        is_to_missing = !to_lang_li.includes(to_lang),
        has_src_id = tran_map.has(to_path);

      if (is_to_missing || is_from_updated || !has_src_id || update_set.has(to_path)) {
        txt ||= await load(from_path);
        if (txt === undefined) {
          break;
        }
        const old_src_id = tran_map.get(to_path)?.[1];
        tran_map.set(to_path, [txt, old_src_id]);
      }
    }
  };

export default async (root, from, to_li, relations, update_set, id_map) => {
  const tran_map = init(id_map),
    cache = new Map(),
    load = async (from_path) => {
      let txt = cache.get(from_path);
      if (txt === undefined) {
        const abs_path = join(root, from_path);
        if (existsSync(abs_path)) {
          txt = await read(abs_path);
          cache.set(from_path, txt);
        }
      }
      return txt;
    };

  for (const [prefix, rel_map] of relations) {
    for (const [rel, to_lang_li] of rel_map) {
      await collect(prefix, rel, to_lang_li, from, to_li, update_set, tran_map, load);
    }
  }

  return tran_map;
};
