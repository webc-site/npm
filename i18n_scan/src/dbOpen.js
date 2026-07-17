import load from "@1-/csv/load.js";
import dumps from "@1-/csv/dumps.js";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const SRC_CSV = "src.csv";

/*
初始化/加载译文数据库与缓存
db_dir: 数据库目录
files: 文件列表
返回值: [id_map, commit]
*/
export default async (db_dir, files) => {
  const db_file = join(db_dir, SRC_CSV),
    file_set = new Set(files),
    id_map = new Map(),
    commit = () => {
      mkdirSync(dirname(db_file), { recursive: true });
      writeFileSync(db_file, dumps(Array.from(id_map)));
    },
    // 劫持 set，实现即时写入
    origSet = id_map.set.bind(id_map);
  id_map.set = (path, src_id) => {
    const res = origSet(path, src_id);
    commit();
    return res;
  };

  if (existsSync(db_file)) {
    for (const [path, src_id] of await load(db_file)) {
      if (file_set.has(path)) {
        origSet(path, Number(src_id));
      }
    }
  }

  return [id_map, commit];
};
