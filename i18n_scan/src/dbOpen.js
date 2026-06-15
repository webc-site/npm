import load from "@1-/csv/load.js";
import dumps from "@1-/csv/dumps.js";
import b64Uint8 from "@3-/base64url/b64Uint8.js";
import uint8B64 from "@3-/base64url/uint8B64.js";
import { join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

const SRC_CSV = "src.csv";

/*
初始化/加载译文数据库与缓存
root: 项目根目录
db_dir: 数据库目录
upsert: 更新函数
files: 文件列表
返回值: [doUpsert, md5_map]
*/
export default async (root, db_dir, upsert, files) => {
  const db_file = join(db_dir, SRC_CSV),
    file_set = new Set(files),
    md5_map = new Map();

  if (existsSync(db_file)) {
    for (const [path, b64_md5] of await load(db_file)) {
      if (file_set.has(path)) {
        md5_map.set(path, b64Uint8(b64_md5));
      }
    }
  }

  const doUpsert = async (path, txt_md5) => {
    if (txt_md5) {
      const [to_txt, from_md5] = txt_md5,
        abs_path = join(root, path);

      await writeFile(abs_path, to_txt);
      md5_map.set(path, from_md5);
    }

    await upsert(path);
  };

  doUpsert[Symbol.dispose] = () => {
    writeFileSync(db_file, dumps(Array.from(md5_map, ([path, md5]) => [path, uint8B64(md5)])));
    upsert[Symbol.dispose]();
  };

  return [doUpsert, md5_map];
};
