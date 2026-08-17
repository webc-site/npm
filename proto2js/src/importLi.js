import removeComment from "@3-/proto_remove_comment";

export default (txt) => {
  let package_name = "";
  const import_li = [];
  txt = removeComment(txt).replace(/\b(?:import|package)\s+[^;]+;/g, (match) => {
    if (match.startsWith("package")) {
      package_name = match.slice(8, -1).trim();
    } else {
      import_li.push(match.slice(7, -1).trim().slice(1, -1));
    }
    return "";
  });
  return [import_li, txt, package_name];
};
