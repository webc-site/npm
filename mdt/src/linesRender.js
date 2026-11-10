import read from "@1-/read";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import li from "@1-/md/li.js";
import code from "@1-/md/code.js";
import WARN from "@3-/log/WARN.js";
import inCode from "./inCode.js";

/*
递归展开并渲染导入标签 (<+ 路径 >)
lines: 待处理文本行数组
dir: 当前解析目录
src_path: 源文件路径
seen: 已包含文件集合，防止死循环
返回值: 展开后文本行数组
*/
const render = async (
  lines,
  dir,
  src_path,
  seen = new Set(src_path ? [resolve(src_path)] : [])
) => {
  const in_code = inCode(code(lines)),
    rendered = await Promise.all(
      lines.map(async (line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("<+") && trimmed.endsWith(">") && !in_code(i + 1)) {
          const rel_path = trimmed.slice(2, -1).trim(),
            abs_path = resolve(dir, rel_path);
          if (seen.has(abs_path)) {
            WARN(src_path + " CIRCULAR " + abs_path);
            return [line];
          }
          if (existsSync(abs_path)) {
            return render(
              li(await read(abs_path)),
              dirname(abs_path),
              abs_path,
              new Set(seen).add(abs_path)
            );
          }
          WARN(src_path + " MISS " + abs_path);
        }
        return [line];
      })
    );
  return rendered.flat();
};

export default render;
