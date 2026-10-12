/*
代码块双指针判定
code_blocks: 代码块区间数组 [[语言, 开始行号, 结束行号], ...]
返回值: (line_num) => 是否在代码块内
*/
export default (code_blocks) => {
  let idx = 0;
  return (line_num) => {
    let cur = code_blocks[idx];
    while (cur && line_num > cur[2]) cur = code_blocks[++idx];
    return Boolean(cur && line_num >= cur[1]);
  };
};
