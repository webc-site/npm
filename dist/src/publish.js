import { writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import log from "@3-/log";
import exec from "./exec.js";
import gitSync from "./gitSync.js";
import GREEN from "@3-/log/GREEN.js";

const open = (url) => {
  const platform = process.platform,
    [cmd, args] =
      platform === "darwin"
        ? ["open", [url]]
        : platform === "win32"
          ? ["cmd.exe", ["/c", "start", "", url]]
          : ["xdg-open", [url]],
    child = spawn(cmd, args, {
      detached: true,
      stdio: "ignore"
    });
  child.unref();
};

export default async (
  pkg_path,
  pkg_name,
  tmp_dir,
  pkg_json,
  pkg_json_path,
  current_version,
  next_version
) => {
  try {
    log("正在将 " + pkg_name + " 发布到 npm...");
    exec("npm publish --access public", tmp_dir);
    const url = "https://www.npmjs.com/package/" + pkg_name + "/v/" + current_version;
    GREEN(url);
    if (process.stdout.isTTY) {
      open(url);
    }

    // 发布成功，更新源目录下的 package.json 版本号
    pkg_json.version = next_version;
    await writeFile(pkg_json_path, JSON.stringify(pkg_json, null, 2) + "\n");
    log("成功更新本地 package.json 版本号为: " + next_version);

    // 执行 git 同步（提交并推送 dev，合并到 main 并推送）
    await gitSync(next_version, pkg_path);
  } finally {
    await rm(tmp_dir, { recursive: true, force: true });
  }
};
