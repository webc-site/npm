import ifElse from "./ifElse.js";

/*
创建 GitHub 分支
branch: 分支名
sha: 基于的 Commit SHA
*/
export default (req) => (branch, sha) =>
  ifElse(
    () =>
      req("git/refs", {
        method: "POST",
        body: {
          ref: "refs/heads/" + branch,
          sha
        }
      }),
    (err) => {
      if (err.status !== 422) {
        throw err;
      }
    }
  )();
