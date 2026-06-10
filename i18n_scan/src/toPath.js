import { sep } from "node:path";

export default (prefix, rel, to_lang, dir_li) => {
  const dir = dir_li.find((d) => prefix === d || prefix.endsWith(sep + d)),
    base = prefix.slice(0, prefix.length - dir.length);
  return base + dir + sep + to_lang + sep + rel;
};
