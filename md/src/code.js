/*
解析 Markdown 文本行，提取所有代码块的位置和语言类型（包括无语言标记的代码块）
参数 li: Markdown 文本行数组
返回: 代码块信息数组，格式为 [[语言, 开始行号, 结束行号], ...]
*/
export default (li) => {
  const blocks = [];
  let in_block = false,
    end_marker = "",
    type = "",
    start_line = 0;

  li.forEach((line, i) => {
    const trimmed = line.trim();
    if (!in_block) {
      if (trimmed.startsWith("```")) {
        let count = 3;
        while (trimmed[count] === "`") {
          ++count;
        }
        in_block = true;
        end_marker = trimmed.slice(0, count);
        type = trimmed.slice(count).trim();
        start_line = i + 1;
      }
    } else {
      if (trimmed === end_marker) {
        in_block = false;
        blocks.push([type, start_line, i + 1]);
      }
    }
  });

  if (in_block) {
    blocks.push([type, start_line, li.length + 1]);
  }

  return blocks;
};
