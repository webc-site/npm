import code from "@1-/md/code.js";
import anchor from "./anchor.js";
import inCode from "./inCode.js";

const HEADER_RE = /^(#+)\s+(.*)/;

/*
解析行数组中的 Markdown 标题
lines: Markdown 文本行数组
返回值: 标题信息数组 [行索引, 级别, 文本, 锚点]
*/
export default (lines) => {
  const in_code = inCode(code(lines)),
    headers = [];

  lines.forEach((line, i) => {
    if (in_code(i + 1)) return;

    const match = line.match(HEADER_RE);
    if (match) {
      const text = match[2].trim();
      headers.push([i, match[1].length, text, anchor(text)]);
    }
  });
  return headers;
};
