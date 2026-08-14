export default (raw_name) => {
  if (!raw_name) return [];
  let pkg_part = raw_name,
    sub_name = "";

  if (raw_name.includes("/")) {
    const parts = raw_name.split("/"),
      split_idx = raw_name.startsWith("@") ? 2 : 1;
    if (parts.length > split_idx) {
      pkg_part = parts.slice(0, split_idx).join("/");
      sub_name = parts.slice(split_idx).join("/");
    }
  }

  const last_at = pkg_part.lastIndexOf("@"),
    ver = last_at > 0 ? pkg_part.slice(last_at + 1) : "",
    pkg_name = last_at > 0 ? pkg_part.slice(0, last_at) : pkg_part,
    comp_name = sub_name || pkg_name.split("/").pop();

  return [pkg_part, ver, comp_name];
};
