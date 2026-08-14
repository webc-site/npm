import gitCmd from "./cmd.js";

export default async (root, next, pkg_file = "package.json") => {
  const git = gitCmd(root),
    { env } = process;

  if (env.GITHUB_ACTIONS) {
    await git('config user.name "github-actions[bot]"');
    await git('config user.email "github-actions[bot]@users.noreply.github.com"');
  }

  await git("add " + pkg_file);
  await git('commit -m "v' + next + '" --no-verify');

  const token = env.GH_TOKEN || env.GITHUB_TOKEN,
    remote =
      token && env.GITHUB_REPOSITORY
        ? "https://x-access-token:" + token + "@github.com/" + env.GITHUB_REPOSITORY + ".git"
        : "origin";

  await git("pull " + remote + " main --rebase --no-verify").catch(() => {});

  console.log("pushing committed package.json to main branch...");
  await git("push " + remote + " HEAD:main --no-verify");

  console.log("creating tag v" + next + " and pushing...");
  await git("tag -f v" + next);
  await git("push " + remote + " v" + next + " -f --no-verify");
};
