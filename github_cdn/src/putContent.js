export default (req) => (file_path, branch_name, content) =>
  req("contents/" + file_path, {
    method: "PUT",
    body: {
      message: "upload " + file_path,
      content,
      branch: branch_name
    }
  });
