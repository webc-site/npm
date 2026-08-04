import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { $ } from "@3-/zx";
import gitCmd from "./cmd.js";

const tagFmt = (tag) =>
  tag ? (tag.startsWith("v") || tag === "main" || tag === "master" ? tag : "v" + tag) : "main";

export default async (repo_url, target_dir, tag_or_branch) => {
  const target_tag = tagFmt(tag_or_branch);

  if (existsSync(target_dir)) {
    const git = gitCmd(target_dir);
    await git("fetch -f --tags --all -q");
    await git("checkout -q " + target_tag);
    if (target_tag === "main" || target_tag === "master") {
      await git("pull --no-verify -q").catch(() => {});
    }
  } else {
    console.log("cloning " + repo_url + " (" + target_tag + ") to " + target_dir + "...");
    mkdirSync(dirname(target_dir), { recursive: true });
    await $({ cwd: dirname(target_dir) })([
      "git clone -c advice.detachedHead=false -q -b " +
        target_tag +
        " " +
        repo_url +
        " " +
        target_dir
    ]);
  }
};
