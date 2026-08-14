import ERR from "@3-/log/ERR.js";
import gitCmd from "./cmd.js";
import remotes from "./remotes.js";

export default async (root) => {
  const git = gitCmd(root);
  try {
    const [remote_li, gh_remote] = await remotes(root);

    console.log("pulling main from " + gh_remote + "...");
    await git("pull " + gh_remote + " main --no-verify");

    for (const remote of remote_li) {
      console.log("pushing to remote " + remote + " release branch...");
      await git("push " + remote + " HEAD:release --force --no-verify");
    }
    console.log("release push success!");
  } catch (err) {
    ERR("git push release failed: " + err.message);
    throw err;
  }
};
