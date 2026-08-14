import ifElse from "./ifElse.js";

export default (req) =>
  ifElse(
    async () => {
      const ref_res = await req("git/ref/heads/main"),
        {
          object: { sha }
        } = await ref_res.json();
      return sha;
    },
    async (err) => {
      if (err.status === 404) {
        const repo_res = await req(""),
          { default_branch } = await repo_res.json(),
          ref_res = await req("git/ref/heads/" + default_branch),
          {
            object: { sha }
          } = await ref_res.json();

        await ifElse(
          () =>
            req("git/refs", {
              method: "POST",
              body: {
                ref: "refs/heads/main",
                sha
              }
            }),
          (create_err) => {
            if (create_err.status !== 422) {
              throw create_err;
            }
          }
        )();

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
