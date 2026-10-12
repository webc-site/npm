/*
文本转 Markdown 锚点
text: 待转换文本
返回值: 锚点字符串
*/
export default (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/[\s-]+/g, "-");
