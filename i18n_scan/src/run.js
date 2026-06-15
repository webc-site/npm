/*
控制并执行所有的翻译子任务

参数:
to_tran_map: 待翻译的任务映射表
tran: 翻译执行函数
bar: 进度条实例
total_tran: 总翻译任务数
*/
export default async (to_tran_map, tran, bar, total_tran) => {
  if (total_tran > 0) {
    bar.start(total_tran, 0);
    try {
      for (const [prefix, rel_map] of to_tran_map) {
        for (const rel of rel_map.keys()) {
          await tran(prefix, rel);
        }
      }
    } finally {
      bar.stop();
    }
  }
};
