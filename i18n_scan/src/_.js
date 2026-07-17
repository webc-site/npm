import { isAbsolute, relative, join } from "node:path";
import bar from "@1-/bar";
import walk from "./walk.js";
import rm from "./rm.js";
import relParse from "./relParse.js";
import scan from "./scan.js";
import pLimit from "@3-/plimit";

const dbDir = (root, db_dir, prefix) => {
  if (isAbsolute(db_dir)) {
    if (db_dir.startsWith(root)) {
      const rel = relative(root, db_dir);
      return join(root, prefix, rel);
    }
    return join(db_dir, prefix);
  }
  return join(root, prefix, db_dir);
};

/*
扫描物理文件，清理冗余，增量扫描并构建最终的翻译状态树
root: 项目根目录
db_dir: 状态数据库路径
from: 源语言代码
to_li: 目标语言代码列表
updateCache: 译文缓存更新回调
tran: 翻译函数
i18n_dir_name_li: 翻译文件所在目录列表
ext_li: 翻译文件后缀列表
limit: 可选的 plimit 限制器实例
*/
export default async (root, db_dir, from, to_li, updateCache, tran, i18n_dir_name_li, ext_li) => {
  const [start, stop, incr, log] = bar(),
    res = await walk(root, from, to_li, i18n_dir_name_li, ext_li),
    _ = await rm(res, root, to_li),
    [, relations] = relParse(res, from, to_li),
    task_li = [],
    cache_task_li = [],
    dispose_li = [],
    limit = pLimit(8),
    p_results = await Promise.all(
      Array.from(relations.keys()).map((prefix) =>
        limit(() =>
          scan(
            root,
            join(root, prefix),
            dbDir(root, db_dir, prefix),
            prefix,
            from,
            to_li,
            relations.get(prefix),
            log,
            updateCache,
            tran,
            incr
          )
        )
      )
    );

  let total = 0;
  for (const [p_tasks, p_cache_tasks, p_dispose, p_total] of p_results) {
    task_li.push(...p_tasks);
    cache_task_li.push(...p_cache_tasks);
    dispose_li.push(p_dispose);
    total += p_total;
  }

  // 先并行执行所有本地缓存更新任务
  if (cache_task_li.length > 0) {
    await Promise.all(cache_task_li.map((task) => task()));
  }

  if (total > 0) {
    start(total, 0);
    try {
      await Promise.all(task_li.map((task) => task(limit)));
    } finally {
      stop();
    }
  }

  dispose_li.forEach((dispose) => dispose());
};
