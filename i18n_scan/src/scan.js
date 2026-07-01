import { sep } from "node:path";
import scan from "@1-/scan";
import dbOpen from "./dbOpen.js";
import idCollect from "./idCollect.js";
import tranLiGen from "./tranLiGen.js";
import exec from "./exec.js";
import traner from "./traner.js";

/*
扫描并解析单目录(prefix)中的翻译文件并生成任务
root: 项目根目录
p_root: 该翻译目录的物理根路径 (root + prefix)
p_db_dir: 该目录专属数据库目录
real_prefix: 翻译目录的相对路径
from: 源语言类型
to_li: 目标语言类型列表
p_relations: 该目录内的文件关系
log: 日志函数
updateCache: 译文缓存更新回调
tran: 翻译函数
incr: 进度自增回调
返回值: [tasks, dispose]
*/

export default async (
  root,
  p_root,
  p_db_dir,
  real_prefix,
  from,
  to_li,
  p_relations,
  log,
  updateCache,
  tran,
  incr,
) => {
  const p_files = [];
  for (const [rel, to_lang_li] of p_relations) {
    p_files.push(from + sep + rel);
    for (const to_lang of to_lang_li) {
      p_files.push(to_lang + sep + rel);
    }
  }

  const [p_update, p_upsert] = await scan(p_root, p_db_dir, p_files),
    [p_id_map, p_commit] = await dbOpen(p_db_dir, p_files),
    relations_wrapped = new Map([["", p_relations]]),
    p_tran_map = await idCollect(
      p_root,
      from,
      to_li,
      relations_wrapped,
      new Set(p_update),
      p_id_map,
    ),
    [to_tran, cache, total] = tranLiGen(new Set(p_update), from, to_li, relations_wrapped),
    [runCache, runTran] = exec(
      p_root,
      p_id_map,
      p_tran_map,
      log,
      p_upsert,
      updateCache,
      tran,
      from,
    ),
    wrappedRunCache = (prefix, rel, to_lang, to_path) =>
      runCache(real_prefix, rel, to_lang, to_path),
    wrappedRunTran = (prefix, rel, to_lang, to_path) => runTran(real_prefix, rel, to_lang, to_path),
    p_cache_tasks = cache.map(
      ([, rel, to, path]) =>
        () =>
          wrappedRunCache("", rel, to, path),
    ),
    tranFile = traner(wrappedRunTran, from, to_tran, p_upsert, incr),
    p_tasks = [],
    map = to_tran.get("");
  if (map) {
    for (const rel of map.keys()) {
      p_tasks.push((limit) => tranFile("", rel, limit));
    }
  }

  const dispose = () => {
    p_commit();
    p_upsert[Symbol.dispose]();
  };

  return [p_tasks, p_cache_tasks, dispose, total];
};
