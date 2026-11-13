/*
生成目录文本行
headers: 标题信息数组
返回值: 目录文本行数组
*/
export default (headers) => {
  const sub = headers.filter(([, level]) => level > 1);
  if (!sub.length) return [];
  const min_level = Math.min(...sub.map(([, level]) => level));
  return sub.map(
    ([, level, text, anchor]) =>
      "  ".repeat(level - min_level) + "- [" + text + "](#" + anchor + ")"
  );
};
