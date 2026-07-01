import read from "@1-/read";

import li from "@1-/md/li.js";
import blockRender from "./blockRender.js";

/*
处理 mdt 文件主入口，读取文件内容，按 "---" 分块渲染并注入目录，最后用 "---" 重新连接
参数 mdt_path: mdt 文件绝对路径
参数 pkg_path: 包绝对路径
返回: 渲染后的完整 Markdown 内容
*/
export default async (mdt_path, pkg_path) => {
  let len = 0;
  const mdt_content = await read(mdt_path),
    mdt_lines = li(mdt_content),
    blocks = mdt_lines.reduce(
      (acc, line) => {
        if (line === "---") {
          ++len;
          acc.push([]);
        } else {
          acc[len].push(line);
        }
        return acc;
      },
      [[]],
    ),
    rendered_blocks = await Promise.all(
      blocks.map((block) => blockRender(block, pkg_path, mdt_path)),
    );
  return rendered_blocks.join("\n---\n");
};
