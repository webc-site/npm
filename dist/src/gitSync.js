import path from "node:path";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { simpleGit } from "simple-git";

const mergeToMain = async (git, git_tmp_dir) => {
  await git.raw("worktree", "prune");
  await git.raw("worktree", "add", git_tmp_dir, "main");

  const git_tmp = simpleGit(git_tmp_dir);
  await git_tmp.fetch("origin", "main");
  await git_tmp.reset(["--hard", "origin/main"]);
  await git_tmp.merge(["dev", "--no-edit"]);
  await git_tmp.push("origin", "main");
};

export default async (pkg_name, current_version, next_version, work_dir) => {
  const git = simpleGit(work_dir),
    git_tmp_dir = path.join(tmpdir(), "m-" + crypto.randomUUID());

  console.log("正在提交并推送 dev 分支...");
  await git.add("-A");
  await git.commit("v" + next_version);
  await git.push("origin", "dev");

  console.log("正在合并到 main 分支并推送...");
  try {
    await mergeToMain(git, git_tmp_dir);
  } finally {
    try {
      await git.raw("worktree", "remove", git_tmp_dir, "--force");
    } catch {
      try {
        await fs.rm(git_tmp_dir, { recursive: true, force: true });
      } catch {}
    }
  }
};
