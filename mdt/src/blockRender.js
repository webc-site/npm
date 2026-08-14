import li from "@1-/md/li.js";
import linesRender from "./linesRender.js";
import headerParse from "./headerParse.js";
import tocGen from "./tocGen.js";
import tocInject from "./tocInject.js";

/*
参数 block: 包含外部引用标签的原始行数据
参数 pkg_path: 当前包路径
返回: 渲染并注入目录后的 Markdown 文本
*/
export default async (block, pkg_path, mdt_path) => {
  const block_lines = await linesRender(block, pkg_path, mdt_path),
    block_text = block_lines.join("\n"),
    lines = li(block_text),
    headers = headerParse(lines),
    toc_lines = tocGen(headers);
  return tocInject(lines, headers, toc_lines).join("\n");
};
