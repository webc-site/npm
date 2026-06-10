import walk from "./_.js";

export default async (dir, parse, concurrency) => {
  let len = dir.length;
  if (!["/", "\\"].includes(dir[len - 1])) ++len;
  return walk(dir, (kind, path) => parse(kind, path.slice(len)), concurrency);
};
