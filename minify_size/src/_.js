import { relative, join } from "node:path";
import { realpathSync } from "node:fs";
import Table from "cli-table3";
import { FILE } from "@1-/walk";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import utf8e from "@3-/utf8";
import bundle from "@1-/rolldown";

const TABLE_STYLE = { "padding-left": 0, "padding-right": 0 },
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
  },
  /*
  获取字符串 zstd 压缩后大小
  参数: str 待压缩字符串
  返回值: 字节数
  */
  zstd = async (str) => (await Bun.zstdCompress(utf8e(str), { level: 3 })).byteLength,
  /*
  输出打包大小表格
  参数:
  list 包含 [相对路径, 大小] 的数组
  total 整体压缩后大小
  */
  show = (list, total) => {
    const table = new Table({ chars: NO_BORDER, style: TABLE_STYLE });
    list.forEach(([rel_path, size]) => table.push([rel_path, size]));
    table.push(["整体打包压缩后大小", total]);
    console.log(table.toString());
  };

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
    show([], 0);
    return 0;
  }

  files.sort().forEach((rel_path) => {
    const abs = realpathSync(join(real_dir, rel_path));
    input[rel_path.slice(0, -3)] = abs;
    out_map[abs] = abs;
  });

  const chunks = await bundle(input, {}, true, undefined, out_map),
    sizes = (
      await Promise.all(
        chunks.map(async ([abs_out_path, code]) => [
          relative(real_dir, abs_out_path),
          await zstd(code),
          code,
        ]),
      )
    ).sort((a, b) => a[0].localeCompare(b[0]));

  const total_size = await zstd(sizes.map(([, , code]) => code).join(""));
  show(sizes, total_size);

  return total_size;
};
