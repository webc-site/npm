import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import rJson from "@3-/read/rJson.js";
import cleanPkgJson from "./cleanPkgJson.js";
import readme from "./readme.js";
import publish from "./publish.js";
import gciCommit from "./gci.js";
import ROOT from "../../_/ROOT.js";
import opencodeReadme from "./opencodeReadme.js";
import knipCheck from "./knip.js";

export default async (pkg_folder) => {
  await knipCheck();

  const pkg_path = path.resolve(pkg_folder);
  await opencodeReadme(pkg_path);

  await gciCommit(ROOT);

  const pkg_json_path = path.join(pkg_path, "package.json"),
    pkg_json = rJson(pkg_json_path),
    pkg_name = pkg_json.name,
    current_version = pkg_json.version,
    version_parts = current_version.split(".");

  version_parts[2] = String(Number(version_parts[2]) + 1);
  const next_version = version_parts.join("."),
    // 4. 创建临时目录并复制 src 目录下的内容
    tmp_dir = path.join(tmpdir(), "npm-publish-" + pkg_folder + "-" + crypto.randomUUID()),
    src_dir = path.join(pkg_path, "src");

  await fs.mkdir(tmp_dir, { recursive: true });

  if (existsSync(src_dir)) {
    const entries = await fs.readdir(src_dir);
    for (const entry of entries) {
      await fs.cp(path.join(src_dir, entry), path.join(tmp_dir, entry), { recursive: true });
    }
  }

  // 写入清理后的 package.json
  const cleaned_pkg = cleanPkgJson(pkg_json, current_version);
  await fs.writeFile(
    path.join(tmp_dir, "package.json"),
    JSON.stringify(cleaned_pkg, null, 2) + "\n",
  );

  // 渲染并复制 README
  await readme(pkg_path, tmp_dir);

  // 5. 执行发布与版本更新，以及 Git 同步
  await publish(pkg_name, tmp_dir, pkg_json, pkg_json_path, current_version, next_version);
};
