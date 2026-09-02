import { dirname } from "node:path";
import read from "@1-/read";
import li from "@1-/md/li.js";
import blockRender from "./blockRender.js";

/*
分块渲染 mdt 文件并注入目录
mdt_path: mdt 文件绝对路径
dir: 当前目录路径，默认值为 mdt 文件所在目录
返回值: 渲染后的 Markdown 内容
*/
export default async (mdt_path, dir = dirname(mdt_path)) => {
  const lines = li(await read(mdt_path)),
    blocks = lines.reduce(
      (acc, line) => (line === "---" ? acc.push([]) : acc.at(-1).push(line), acc),
      [[]]
    ),
    rendered = await Promise.all(blocks.map((block) => blockRender(block, dir, mdt_path)));
  return rendered.join("\n---\n");
};
