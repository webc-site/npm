import { join, isAbsolute } from "node:path";
import { realpathSync } from "node:fs";
import { promisify } from "node:util";
import { brotliCompress } from "node:zlib";
import { FILE } from "@1-/walk";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import utf8e from "@3-/utf8";
import bundle from "@1-/rolldown";

const BROTLI = promisify(brotliCompress),
  /*
  获取字符串 brotli 压缩后大小
  参数: str 待压缩字符串
  返回值: 字节数
  */
  br = async (str) => (await BROTLI(utf8e(str))).length;

/*
打包并计算指定目录下 JS 文件压缩后大小
参数: dir 目录路径
返回值: 整体打包压缩大小 (字节)
*/
export default async (dir) => {
  const real_dir = realpathSync(dir),
    files = [],
    input = {},
    out_map = {};

  await walkRelIgnore(real_dir, (kind, rel_path) => {
    if (kind === FILE && rel_path.endsWith(".js") && !/(^|\/)tests?(\/|$)/.test(rel_path)) {
      files.push(rel_path);
    }
  });

  if (!files.length) {
    return 0;
  }

  files.sort().forEach((rel_path) => {
    const abs = realpathSync(join(real_dir, rel_path));
    input[rel_path.slice(0, -3)] = abs;
    out_map[abs] = abs;
  });

  const chunks = await bundle(
      input,
      {
        external: (id) => !id.startsWith(".") && !isAbsolute(id),
      },
      true,
      undefined,
      out_map,
    ),
    total_size = await br(chunks.map(([, code]) => code).join(""));

  return total_size;
};
