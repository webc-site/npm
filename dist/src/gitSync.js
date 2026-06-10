import log from "@3-/log";
import findgit from "@1-/findgit";
import exec from "./exec.js";
import gitMerge from "./gitMerge.js";

export default async (ver, dir) => {
  const gitdir = findgit(dir);
  log("正在提交并推送 dev 分支...");
  exec("git add -A", gitdir);
  exec('git commit -m "v' + ver + '"', gitdir);
  exec("git push origin dev", gitdir);

  log("正在合并到 main 分支并推送...");
  await gitMerge(gitdir);
};
