import req from "@3-/req/_req.js";

const API = "https://api.github.com/repos/";

export default (token, org_repo) => {
  const headers = {
      Authorization: "token " + token,
      "User-Agent": "-"
    },
    prefix = API + org_repo;

  return (url, option) => {
    option ??= {};
    option.headers = { ...headers, ...option.headers };
    return req(prefix + (url ? "/" + url : ""), option);
  };
};
