import { join } from "node:path";
import read from "@3-/read";
import write from "@3-/write";
import npm from "../lib/npm.js";

export default async (root, out = "npm", minify = true) => {
  await npm(root, out, minify);
  const pkg = JSON.parse(read(join(root, "package.json")));
  ["lint-staged", "devDependencies", "scripts"].forEach((i) => delete pkg[i]);
  write(join(root, "dist", out, "package.json"), JSON.stringify(pkg));
};
