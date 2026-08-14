import code from "@1-/md/code.js";
import anchor from "./anchor.js";

export const INDEX = 0,
  LEVEL = 1,
  TEXT = 2,
  ANCHOR = 3;

/*
参数 lines: Markdown 文本行数组
返回: 标题信息数组，元素格式为 [索引, 级别, 文本, 锚点]
*/
export default (lines) => {
  const code_blocks = code(lines),
    len = code_blocks.length,
    headers = [];
  let block_idx = 0;

  lines.forEach((line, i) => {
    const line_num = i + 1;
    while (block_idx < len && line_num > code_blocks[block_idx][2]) {
      ++block_idx;
    }
    if (
      block_idx < len &&
      line_num >= code_blocks[block_idx][1] &&
      line_num <= code_blocks[block_idx][2]
    ) {
      return;
    }

    if (line.startsWith("#")) {
      const space_idx = line.indexOf(" ");
      if (space_idx !== -1 && line.slice(0, space_idx) === "#".repeat(space_idx)) {
        const header_text = line.slice(space_idx + 1).trim();
        headers.push([i, space_idx, header_text, anchor(header_text)]);
      }
    }
  });
  return headers;
};
