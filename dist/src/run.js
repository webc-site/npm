import { resolve } from "node:path";

import readme from "./readme.js";
import publish from "./publish.js";
import gci from "./gci.js";
import readmeGen from "./readmeGen.js";
import knip from "./knip.js";
import prep from "./prep.js";

export default async (git_dir, pkg_folder, src_dir = "src") => {
  const pkg_path = resolve(pkg_folder);
  await knip(git_dir, pkg_path);

  await readmeGen(pkg_path);

  await gci(pkg_path);

  const [pkg_name, tmp_dir, pkg_json, pkg_json_path, current_version, next_version] = await prep(
    pkg_path,
    pkg_folder,
    src_dir,
  );

  // 渲染并复制 README
  await readme(git_dir, pkg_path, tmp_dir, src_dir);

  // 执行发布与版本更新，以及 Git 同步
  await publish(
    pkg_path,
    pkg_name,
    tmp_dir,
    pkg_json,
    pkg_json_path,
    current_version,
    next_version,
  );
};
