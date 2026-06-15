import { join } from "node:path";
import { existsSync } from "node:fs";
import pathMd5 from "@1-/md5/pathMd5.js";
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
md5_map: 已存在译文的MD5映射

返回值:
traned_path_src_txt_md5: 目标译文路径至其源文件内容及MD5的映射
*/
const initPathMap = (md5_map) =>
    new Map(Array.from(md5_map, ([to_path, from_md5]) => [to_path, [undefined, from_md5]])),
  makeReader = (root) => {
    const cache = new Map();
    return async (from_path) => {
      let info = cache.get(from_path);
      if (!info) {
        const abs_path = join(root, from_path);
        if (existsSync(abs_path)) {
          info = [await read(abs_path), await pathMd5(abs_path)];
          cache.set(from_path, info);
        }
      }
      return info;
    };
  },
  collectLangs = async (
    prefix,
    rel,
    to_lang_li,
    from,
    to_li,
    update_set,
    traned_path_src_txt_md5,
    readInfo,
  ) => {
    const from_path = langPath(prefix, rel, from),
      is_from_updated = update_set.has(from_path);

    let info;
    for (const to_lang of to_li) {
      const to_path = langPath(prefix, rel, to_lang),
        is_to_missing = !to_lang_li.includes(to_lang),
        has_src_md5 = traned_path_src_txt_md5.has(to_path);

      if (is_to_missing || is_from_updated || !has_src_md5 || update_set.has(to_path)) {
        info ||= await readInfo(from_path);
        if (!info) {
          break;
        }
        traned_path_src_txt_md5.set(to_path, info);
      }
    }
  };

export default async (root, from, to_li, relations, update_set, md5_map) => {
  // 用已有的 MD5 映射初始化译文状态
  const traned_path_src_txt_md5 = initPathMap(md5_map),
    // 创建支持内部缓存的文件读取器
    readInfo = makeReader(root);

  // 遍历所有目录前缀与关联关系
  for (const [prefix, rel_map] of relations) {
    for (const [rel, to_lang_li] of rel_map) {
      // 收集并更新特定路径下的目标语言翻译状态
      await collectLangs(
        prefix,
        rel,
        to_lang_li,
        from,
        to_li,
        update_set,
        traned_path_src_txt_md5,
        readInfo,
      );
    }
  }

  // 返回目标译文路径的映射
  return traned_path_src_txt_md5;
};
