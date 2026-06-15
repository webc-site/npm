import read from "@3-/read";
import { minifySync } from "oxc-minify";
import { promisify } from "node:util";
import { brotliCompress } from "node:zlib";
import utf8e from "@3-/utf8";
import { basename } from "node:path";

const BROTLI = promisify(brotliCompress),
  MINIFY_OPT = {
    compress: { target: "esnext" },
    codegen: { removeWhitespace: true },
  };

// file_path 压缩文件路径。返回 [brotli压缩后大小, 压缩后代码]
export default async (file_path) => {
  const code = read(file_path),
    { code: mini } = minifySync(basename(file_path), code, MINIFY_OPT);
  return [(await BROTLI(utf8e(mini))).length, mini];
};
