import code from "@1-/md/code.js";
import anchor from "./anchor.js";

/*
解析行数组中的 Markdown 标题
lines: Markdown 文本行数组
返回值: 标题信息数组 [行索引, 级别, 文本, 锚点]
*/
export default (lines) => {
  let block_idx = 0;
  const code_blocks = code(lines),
    headers = [];

  lines.forEach((line, i) => {
    const line_num = i + 1;
    while (code_blocks[block_idx] && line_num > code_blocks[block_idx][2]) {
      ++block_idx;
    }
    if (code_blocks[block_idx] && line_num >= code_blocks[block_idx][1]) return;

    const match = line.match(/^(#+)\s+(.*)/);
    if (match) {
      const text = match[2].trim();
      headers.push([i, match[1].length, text, anchor(text)]);
    }
  });
  return headers;
};
