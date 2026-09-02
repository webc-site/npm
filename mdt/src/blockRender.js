import linesRender from "./linesRender.js";
import headerParse from "./headerParse.js";
import tocGen from "./tocGen.js";
import tocInject from "./tocInject.js";

/*
渲染单块内容并注入目录
block: 原始行数组
dir: 当前目录路径
mdt_path: mdt 文件绝对路径
返回值: 渲染后的 Markdown 文本
*/
export default async (block, dir, mdt_path) => {
  const lines = await linesRender(block, dir, mdt_path),
    headers = headerParse(lines);
  return tocInject(lines, headers, tocGen(headers)).join("\n");
};
