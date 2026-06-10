import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import githubCdn from "@1-/github_cdn";
import renderMdt from "@1-/mdt";
import svg from "./svg.js";

const README = "README.md",
  MDT = README + "t",
  load = (conf_dir) => async (path) => (await import(join(conf_dir, path))).default;

export default async (git_dir, pkg_path, tmp_dir, src_dir) => {
  const mdt_path = join(pkg_path, MDT);
  if (existsSync(mdt_path)) {
    const conf_dir = join(git_dir, "conf"),
      conf = load(conf_dir),
      token = await conf("github.js"),
      repo = await conf("github/FS.js"),
      upload = githubCdn(token, repo),
      readme_content = await renderMdt(mdt_path, pkg_path),
      readme_with_svg = await svg(readme_content, upload),
      write_tasks = [
        writeFile(join(pkg_path, README), readme_content),
        writeFile(join(tmp_dir, README), readme_with_svg),
      ];
    if (src_dir && src_dir !== "src" && src_dir !== ".") {
      const src_readme = join(pkg_path, src_dir, README);
      if (existsSync(src_readme) || src_dir === "lib") {
        write_tasks.push(writeFile(src_readme, readme_with_svg));
      }
    }

    await Promise.all(write_tasks);
  }
};
