import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import render from "@3-/mdt/render.js";
import renderMdMermaid from "@1-/mdmermaid";

const readme = async (pkg_path, tmp_dir) => {
  const mdt_path = path.join(pkg_path, "README.mdt");
  if (existsSync(mdt_path)) {
    const readme_content = await render(mdt_path),
      readme_with_svg = await renderMdMermaid(readme_content);
    await Promise.all([
      fs.writeFile(path.join(pkg_path, "README.md"), readme_content),
      fs.writeFile(path.join(tmp_dir, "README.md"), readme_with_svg),
    ]);
  }
};

export default readme;
