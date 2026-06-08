import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import render from "@3-/mdt/render.js";

const readme = async (pkg_path, tmp_dir) => {
  const mdt_path = path.join(pkg_path, "README.mdt");
  if (existsSync(mdt_path)) {
    const readme_content = await render(mdt_path);
    await fs.writeFile(path.join(tmp_dir, "README.md"), readme_content);
  }
};

export default readme;
