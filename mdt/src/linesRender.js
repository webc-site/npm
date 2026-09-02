import read from "@1-/read";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import li from "@1-/md/li.js";
import code from "@1-/md/code.js";
import WARN from "@3-/log/WARN.js";

/*
递归展开并渲染导入标签 (<+ 路径 >)
lines: 待处理文本行数组
dir: 当前解析目录
src_path: 源文件路径
返回值: 展开后文本行数组
*/
const render = async (lines, dir, src_path) => {
  const code_blocks = code(lines),
    rendered = await Promise.all(
      lines.map(async (line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("<+") && trimmed.endsWith(">")) {
          const line_num = i + 1;
          if (!code_blocks.some(([, start, end]) => line_num >= start && line_num <= end)) {
            const rel_path = trimmed.slice(2, -1).trim(),
              abs_path = resolve(dir, rel_path);
            if (existsSync(abs_path)) {
              return render(li(await read(abs_path)), dirname(abs_path), abs_path);
            }
            WARN(src_path + " MISS " + abs_path);
          }
        }
        return [line];
      })
    );
  return rendered.flat();
};

export default render;
