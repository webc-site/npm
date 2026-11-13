import { join } from "node:path";
import load from "@1-/yml/load.js";

export default (root) => {
  const tran_yml_path = join(root, "tran.yml"),
    parsed = load(tran_yml_path);
  return parsed.tran.from;
};
