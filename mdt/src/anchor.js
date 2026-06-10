/*
参数 text: 待转为锚点的文本
返回: 格式化后的锚点字符串
*/
export default (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .split(/\s+/)
    .join("-")
    .replace(/-+/g, "-");
