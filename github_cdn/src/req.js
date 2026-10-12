import req from "@3-/req/_req.js";

const API = "https://api.github.com/repos/";

/*
初始化 GitHub API 请求客户端
token: GitHub 认证 Token
org_repo: 仓库名 (如 "owner/repo")
*/
export default (token, org_repo) => {
  const headers = {
      Authorization: "token " + token,
      "User-Agent": "-"
    },
    prefix = API + org_repo;

  return (url, opt) =>
    req(prefix + (url ? "/" + url : ""), {
      ...opt,
      headers: {
        ...headers,
        ...opt?.headers
      }
    });
};
