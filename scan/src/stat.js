import { stat as fsStat } from "node:fs/promises";
import { join } from "node:path";
import int from "@3-/int";
import strmd5 from "@1-/hash/strmd5.js";

/*
获取文件的大小、修改时间（秒）以及路径哈希
dir: 基础目录
rel_path: 相对路径
返回值: [大小, 修改时间, 路径哈希]
*/
export default async (dir, rel_path) => {
  const { size, mtimeMs: mtime_ms } = await fsStat(join(dir, rel_path));
  return [size, int(mtime_ms), strmd5(rel_path)];
};
