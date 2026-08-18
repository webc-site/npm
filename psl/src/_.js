import PSL from "./psl.js";

const TYPE_WILDCARD = 2,
  TYPE_EXCEPTION = 3;

/*
提取 Host 的根域名 (eTLD+1)
host: 域名字符串
返回值: 根域名字符串
*/
export default (host) => {
  if (!host.includes(".")) return host;
  const parts = host.toLowerCase().split(".");
  let node = PSL,
    type = 0,
    pos;

  for (let i = parts.length - 1; i >= 0; --i) {
    const curr = node?.[parts[i]];
    if (!curr) {
      if (type === TYPE_WILDCARD) pos = i;
      break;
    }
    if (Array.isArray(curr)) [type, node] = curr;
    else if (Number.isInteger(curr)) {
      type = curr;
      node = 0;
    } else {
      type = 0;
      node = curr;
    }
    if (type === TYPE_EXCEPTION) {
      pos = i + 1;
      break;
    }
    if (type) pos = i;
  }
  if (pos != null) return parts.slice(pos > 0 ? pos - 1 : 0).join(".");
  return host;
};
