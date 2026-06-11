import { stat as fsStat } from "node:fs/promises";
import { join } from "node:path";
import int from "@3-/int";
import strmd5 from "@1-/hash/strmd5.js";

export default async (dir, rel_path) => {
  const { size, mtimeMs: mtime_ms } = await fsStat(join(dir, rel_path));
  return [size, int(mtime_ms), strmd5(rel_path)];
};
