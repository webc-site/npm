/*
上传文件内容到 GitHub
path: 文件路径
branch: 分支名
content: Base64 编码内容
*/
export default (req) => (path, branch, content) =>
  req("contents/" + path, {
    method: "PUT",
    body: {
      message: "upload " + path,
      content,
      branch
    }
  });
