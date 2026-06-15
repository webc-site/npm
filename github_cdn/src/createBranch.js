import ifElse from "./ifElse.js";

export default (req) => (branch_name, sha) =>
  ifElse(
    () =>
      req("git/refs", {
        method: "POST",
        body: {
          ref: "refs/heads/" + branch_name,
          sha,
        },
      }),
    (err) => {
      if (err.status !== 422) {
        throw err;
      }
    },
  )();
