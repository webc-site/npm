import { join } from "node:path";
import { promisify } from "node:util";
import { brotliCompress } from "node:zlib";
import Table from "cli-table3";
import { FILE } from "@1-/walk";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import utf8e from "@3-/utf8";
import minify from "./file.js";

const BROTLI = promisify(brotliCompress),
  TABLE_STYLE = { "padding-left": 0, "padding-right": 0 },
  NO_BORDER = {
    top: "",
    "top-mid": "",
    "top-left": "",
    "top-right": "",
    bottom: "",
    "bottom-mid": "",
    "bottom-left": "",
    "bottom-right": "",
    left: "",
    "left-mid": "",
    mid: "",
    "mid-mid": "",
    right: "",
    "right-mid": "",
    middle: " ",
  };

// dir 目录路径。返回整体打包压缩后大小
export default async (dir) => {
  // 收集并排序所有 js 文件
  const files = [];
  await walkRelIgnore(dir, (kind, rel_path) => {
    if (kind === FILE && rel_path.endsWith(".js")) {
      files.push(rel_path);
    }
  });
  files.sort();

  // 压缩各文件并计算整体打包压缩后大小
  const sizes = await Promise.all(
      files.map(async (rel_path) => [rel_path, ...(await minify(join(dir, rel_path)))]),
    ),
    total_size = files.length
      ? (await BROTLI(utf8e(sizes.map(([, , mini]) => mini).join("")))).length
      : 0,
    table = new Table({
      chars: NO_BORDER,
      style: TABLE_STYLE,
    });

  sizes.forEach(([rel_path, size]) => table.push([rel_path, size]));

  table.push(["整体打包压缩后大小", total_size]);
  console.log(table.toString());
  return total_size;
};
