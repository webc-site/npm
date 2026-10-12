import { join, isAbsolute, dirname, basename } from "node:path";
import { realpathSync, statSync } from "node:fs";
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
打包并计算指定目录或 JS 文件压缩后大小
参数: dir 目录或文件路径
返回值: 整体打包压缩大小 (字节)
*/
export default async (dir) => {
  const real_path = realpathSync(dir),
    stat = statSync(real_path),
    is_file = stat.isFile(),
    real_dir = is_file ? dirname(real_path) : real_path,
    files = [],
    input = {},
    out_map = {};

  if (is_file) {
    if (real_path.endsWith(".js")) {
      files.push(basename(real_path));
    }
  } else {
    await walkRelIgnore(real_dir, (kind, rel_path) => {
      if (kind === FILE && rel_path.endsWith(".js") && !/(^|\/)tests?(\/|$)/.test(rel_path)) {
        files.push(rel_path);
      }
    });
  }

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
      external: (id) => !id.startsWith(".") && !isAbsolute(id)
    },
    true,
    real_dir,
    out_map
  );

  return await br(chunks.map(([, code]) => code).join(""));
};
