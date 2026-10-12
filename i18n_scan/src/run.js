import pLimit from "@3-/plimit";

/*
控制并执行所有的翻译子任务

参数:
to_tran: 待翻译的任务映射表
tran: 翻译执行函数
bar: 进度条实例
total: 总翻译任务数
*/
export default async (to_tran, tran, bar, total) => {
  if (total > 0) {
    bar.start(total, 0);
    const limit = pLimit(8),
      tasks = [];
    try {
      for (const [prefix, map] of to_tran) {
        for (const rel of map.keys()) {
          tasks.push(tran(prefix, rel, limit));
        }
      }
      await Promise.all(tasks);
    } finally {
      bar.stop();
    }
  }
};
