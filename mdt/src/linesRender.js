import read from "@1-/read";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import li from "@1-/md/li.js";
import code from "@1-/md/code.js";
import WARN from "@3-/log/WARN.js";

/*
递归展开并渲染导入标签 (<+ 路径 >) 行
block_lines: 待处理文本行数组
current_dir: 当前解析目录
返回: 展开后文本行数组
*/
const linesRender = async (block_lines, current_dir, src_path) => {
  const code_blocks = code(block_lines),
    rendered = await Promise.all(
      block_lines.map(async (line, i) => {
        const line_num = i + 1,
          trimmed = line.trim();
        if (code_blocks.some(([_, start, end]) => line_num >= start && line_num <= end)) {
          return [line];
        }

        if (trimmed.startsWith("<+") && trimmed.endsWith(">")) {
          const rel_path = trimmed.slice(2, -1).trim(),
            abs_path = resolve(current_dir, rel_path);
          if (existsSync(abs_path)) {
            const file_content = await read(abs_path),
              file_lines = li(file_content);
            return linesRender(file_lines, dirname(abs_path), abs_path);
          }
          WARN(src_path + " MISS " + abs_path);
        }
        return [line];
      }),
    );
  return rendered.flat();
};

export default linesRender;
