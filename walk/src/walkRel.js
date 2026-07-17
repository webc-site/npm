import { resolve } from "node:path";
import walk from "./_.js";

export default async (dir, parse, concurrency) => {
  const abs = resolve(dir),
    len = abs.length + (!["/", "\\"].includes(abs[abs.length - 1]) ? 1 : 0);
  return walk(abs, (kind, path) => parse(kind, path.slice(len)), concurrency);
};
