import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import githubCdn from "@1-/github_cdn";
import renderMdt from "@1-/mdt";
import mdimg2cdn from "@1-/mdimg2cdn";

const README = "README.md",
  MDT = README + "t",
  // 动态加载配置
  load = (conf_dir) => async (path) => (await import(join(conf_dir, path))).default;

/*
参数:
git_dir git仓库路径
pkg_path 包路径
tmp_dir 临时路径
src_dir 源码路径
返回值: 无

流程:
校验 README.mdt 存在后
加载 github token 与 repo 配置
渲染 mdt 文件并转换图片为 cdn 链接
并发写入 readme 文件
*/
export default async (git_dir, pkg_path, tmp_dir, src_dir) => {
  const mdt_path = join(pkg_path, MDT);
  if (existsSync(mdt_path)) {
    const conf_dir = join(git_dir, "conf"),
      conf = load(conf_dir),
      token = await conf("github.js"),
      repo = await conf("github/FS.js"),
      upload = githubCdn(token, repo),
      readme_content = await renderMdt(mdt_path, pkg_path),
      readme_cdn = await mdimg2cdn(readme_content, upload, pkg_path),
      write_tasks = [
        writeFile(join(pkg_path, README), readme_content),
        writeFile(join(tmp_dir, README), readme_cdn)
      ];
    if (src_dir && src_dir !== "src" && src_dir !== ".") {
      const src_readme = join(pkg_path, src_dir, README);
      if (existsSync(src_readme) || src_dir === "lib") {
        // 写入自定义源码目录
        write_tasks.push(writeFile(src_readme, readme_cdn));
      }
    }

    await Promise.all(write_tasks);
  }
};
