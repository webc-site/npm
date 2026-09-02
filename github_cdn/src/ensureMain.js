import ifElse from "./ifElse.js";
import createBranch from "./createBranch.js";

/*
确保 main 分支存在并返回其 SHA
req: 请求客户端
*/
export default (req) => {
  const refSha = async (branch_name) => {
      const res = await req("git/ref/heads/" + branch_name),
        {
          object: { sha }
        } = await res.json();
      return sha;
    },
    branch = createBranch(req);

  return ifElse(
    () => refSha("main"),
    async (err) => {
      const { status } = err;
      if (status === 404) {
        const repo_res = await req(""),
          { default_branch } = await repo_res.json(),
          sha = await refSha(default_branch);

        await branch("main", sha);
        await ifElse(
          () =>
            req("", {
              method: "PATCH",
              body: {
                default_branch: "main"
              }
            }),
          () => {}
        )();

        return sha;
      }
      throw err;
    }
  );
};
