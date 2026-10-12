/*
将目录注入到首个子级标题前
lines: 原始文本行数组
headers: 标题信息数组
toc_lines: 目录文本行数组
返回值: 注入目录后的文本行数组
*/
export default (lines, headers, toc_lines) => {
  if (!toc_lines.length) return lines;

  let [insert_idx] = headers.find(([, level]) => level > 1);
  while (insert_idx > 0 && !lines[insert_idx - 1].trim()) {
    lines.splice(insert_idx - 1, 1);
    --insert_idx;
  }

  lines.splice(insert_idx, 0, ...(insert_idx ? ["", ...toc_lines, ""] : [...toc_lines, ""]));
  return lines;
};
