import langPath from "./langPath.js";
/*
初始化文件翻译同步处理函数
run: 执行翻译的回调函数
from: 源语言代码
to_tran: 待翻译任务映射 Map
upsert: 数据库更新函数
incr: 进度自增回调
*/
export default (run, from, to_tran, upsert, incr) => async (prefix, rel, limit) => {
  const li = to_tran.get(prefix).get(rel),
    tasks = li.map((to) =>
      limit(async () => {
        const path = langPath(prefix, rel, to),
          ok = await run(prefix, rel, to, path);
        incr();
        return ok;
      })
    );

  if ((await Promise.all(tasks)).every(Boolean)) {
    await upsert(langPath(prefix, rel, from));
  }
};
