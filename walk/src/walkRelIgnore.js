import { basename } from "node:path";
import walkRel from "./walkRel.js";

export default (dir, parse, concurrency) =>
  walkRel(
    dir,
    (kind, rel_path) => {
      const name = basename(rel_path);
      if (name === "node_modules" || name.startsWith(".")) return false;
      return parse(kind, rel_path);
    },
    concurrency
  );
