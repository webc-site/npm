import { dirname, join, sep } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import WARN from "@3-/log/WARN.js";
import read from "@1-/read";
import ok from "./ok.js";

/*
初始化并构建翻译和缓存更新的回调执行器
root: 项目根目录
id_map: 本地翻译 ID 映射
tran_map: 目标译文路径至源文件文本及 id 的映射 Map
log: 日志输出函数
upsert: 数据库写入与更新函数
updateCache: 译文缓存更新回调
tran: 翻译接口回调
from: 源语言代码
返回值: [runCache, runTran]
*/
export default (root, id_map, tran_map, log, upsert, updateCache, tran, from) => {
  const exec = (action) => async (prefix, rel, to_lang, to_path) => {
    const info = tran_map.get(to_path);
    if (!info) {
      WARN("missing src id " + to_path);
      return 0;
    }
    const res = await ok(action(info, prefix, rel, to_lang, to_path));
    if (res === 1) {
      return 1;
    }
    let err_msg = res?.message || res;
    if (res && typeof res === "object" && typeof res.text === "function") {
      try {
        err_msg = res.status + " " + res.statusText + " " + (await res.clone().text());
      } catch {
        err_msg = res.status + " " + res.statusText;
      }
    }
    log("❌ " + prefix + sep + to_lang + sep + rel + ": " + err_msg);
    return 0;
  };

  return [
    exec(async ([, src_id], prefix, rel, to_lang, to_path) => {
      if (src_id === undefined) {
        return;
      }
      await updateCache(prefix, rel, from, to_lang, await read(join(root, to_path)), src_id, log);
      await upsert(to_path);
    }),
    exec(async ([from_txt], prefix, rel, to_lang, to_path) => {
      const task = prefix + sep + to_lang + sep + rel;
      log.start?.(task);
      try {
        const res = await tran(prefix, rel, from, to_lang, from_txt, log);
        if (res !== undefined) {
          const [to_txt, src_id] = res,
            abs_path = join(root, to_path);

          await mkdir(dirname(abs_path), { recursive: true });
          await writeFile(abs_path, to_txt);
          id_map.set(to_path, src_id);
          await upsert(to_path);
        }
      } finally {
        log.end?.(task);
      }
    })
  ];
};
