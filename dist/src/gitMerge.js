import { rm } from "node:fs/promises";
import { join } from "node:path";
import findgit from "@1-/findgit";
import upsertGitignore from "@1-/upsert_gitignore";
import exec from "./exec.js";

export default async (dir) => {
  const gitdir = findgit(dir),
    gitignore = join(gitdir, ".gitignore"),
    tmp = join(
      gitdir,
      ".tmp",
      "git-sync-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)
    );
  upsertGitignore(gitignore, ["/.tmp/"]);

  try {
    exec('git clone --shared "' + gitdir + '" "' + tmp + '"', gitdir);
    [
      "checkout main",
      "pull origin main --no-verify",
      "merge dev --no-edit --no-verify",
      "push origin main --no-verify"
    ].forEach((cmd) => exec('git -C "' + tmp + '" ' + cmd, gitdir));
    exec("git push origin main --no-verify", gitdir);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
};
