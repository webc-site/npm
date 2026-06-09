import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import render from "@3-/mdt/render.js";

const readme = async (pkg_path, tmp_dir) => {
  const mdt_path = path.join(pkg_path, "README.mdt");
  if (existsSync(mdt_path)) {
    const readme_content = await render(mdt_path),
      ps = [];
    [tmp_dir, pkg_path].forEach((dir) => {
      ps.push(fs.writeFile(path.join(dir, "README.md"), readme_content));
    });
    await Promise.all(ps);
  }
};

export default readme;
