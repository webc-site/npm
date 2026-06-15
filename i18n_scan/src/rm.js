import { rm } from "node:fs/promises";
import { join, sep } from "node:path";

/*
  收集冗余的目标翻译文件删除任务
  res_li: 扫描到的物理文件映射结构
  root: 项目根目录
  to_li: 目标语言代码列表
  返回值: 待执行的物理删除 Promise 任务数组
  */
const collect = (res_li, root, to_li) => {
  const jobs = [];
  for (const [from_map, to_maps] of res_li) {
    for (let i = 0; i < to_maps.length; ++i) {
      const to_map = to_maps[i],
        to_lang = to_li[i];
      for (const [prefix, to_set] of to_map) {
        const from_set = from_map.get(prefix);
        for (const rel of to_set) {
          if (!from_set?.has(rel)) {
            jobs.push(
              (async () => {
                try {
                  await rm(join(root, prefix + sep + to_lang + sep + rel), { force: true });
                } catch {}
                to_set.delete(rel);
              })(),
            );
          }
        }
      }
    }
  }
  return jobs;
};

/*
异步删除所有冗余翻译文件，并清理无翻译项的前缀记录
res_li: 扫描到的物理文件映射结构
root: 项目根目录
to_li: 目标语言代码列表
返回值: 清理完毕后的文件分类映射列表
*/
export default async (res_li, root, to_li) => {
  const jobs = collect(res_li, root, to_li);

  // 并行执行所有文件的物理删除
  if (jobs.length > 0) {
    await Promise.all(jobs);
  }

  // 清理已无翻译项的前缀记录
  for (const [_, to_maps] of res_li) {
    for (const to_map of to_maps) {
      for (const [prefix, to_set] of to_map) {
        if (to_set.size === 0) {
          to_map.delete(prefix);
        }
      }
    }
  }

  return res_li;
};
