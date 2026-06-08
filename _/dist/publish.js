import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import gitSync from "./gitSync.js";
import ROOT from "../ROOT.js";
import GREEN from "@3-/log/GREEN.js";

const pubAndSync = async (
  pkg_name,
  tmp_dir,
  pkg_json,
  pkg_json_path,
  current_version,
  next_version,
) => {
  console.log("正在将 " + pkg_name + " 发布到 npm...");
  execSync("npm publish --access public", { cwd: tmp_dir, stdio: "inherit" });
  GREEN("https://www.npmjs.com/package/" + pkg_name + " " + current_version);

  // B. 发布成功，更新源目录下的 package.json 版本号
  pkg_json.version = next_version;
  await fs.writeFile(pkg_json_path, JSON.stringify(pkg_json, null, 2) + "\n");
  console.log("成功更新本地 package.json 版本号为: " + next_version);

  // C. 清理发布临时目录
  await fs.rm(tmp_dir, { recursive: true, force: true });

  // D. 执行 git 同步（提交并推送 dev，合并到 main 并推送）
  await gitSync(pkg_name, current_version, next_version, ROOT);
};

export default async (
  pkg_name,
  tmp_dir,
  pkg_json,
  pkg_json_path,
  current_version,
  next_version,
) => {
  try {
    await pubAndSync(pkg_name, tmp_dir, pkg_json, pkg_json_path, current_version, next_version);
  } catch (error) {
    // 发布失败，清理临时目录
    try {
      await fs.rm(tmp_dir, { recursive: true, force: true });
    } catch {}
    throw error;
  }
};
