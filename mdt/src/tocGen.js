import { LEVEL, TEXT, ANCHOR } from "./headerParse.js";

/*
根据标题信息生成目录 (TOC) 文本行
参数 headers: 标题信息数组
返回: 目录文本行数组
*/
export default (headers) => {
  if (headers.length === 0) return [];
  const min_level = Math.min(...headers.map((hdr) => hdr[LEVEL]));
  return headers.map(
    (hdr) => "  ".repeat(hdr[LEVEL] - min_level) + "- [" + hdr[TEXT] + "](#" + hdr[ANCHOR] + ")"
  );
};
