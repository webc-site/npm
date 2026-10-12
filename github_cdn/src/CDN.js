const HOST_LI = [
  "jsdmirror.cn",
  "fastly.jsdelivr.net",
  "cdn.jsdelivr.net",
  "cdn.jsdmirror.com",
  "gcore.jsdelivr.net",
  "testingcf.jsdelivr.net"
];

/*
生成 jsDelivr CDN 候选 URL
org_repo: GitHub 仓库名 (如 "owner/repo")
branch: 分支名
path: 文件路径
*/
export default function* (org_repo, branch, path) {
  const suffix = "/gh/" + org_repo + "@" + branch + "/" + path;
  for (const host of HOST_LI) {
    yield "//" + host + suffix;
  }
}
