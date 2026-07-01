import { INDEX } from "./headerParse.js";

/*
将目录文本行注入到第一个标题之后
参数 lines: 原始文本行数组
参数 headers: 标题信息数组
参数 toc_lines: 目录文本行数组
返回: 注入目录后的文本行数组
*/
export default (lines, headers, toc_lines) => {
  if (headers.length === 0 || toc_lines.length === 0) return lines;
  const index = headers[0][INDEX];
  let next_idx = index + 1;
  while (next_idx < lines.length && lines[next_idx].trim() === "") {
    lines.splice(next_idx, 1);
  }
  lines.splice(index + 1, 0, "", ...toc_lines, "");
  return lines;
};
