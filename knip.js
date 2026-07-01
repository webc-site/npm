import read from "@3-/read";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = import.meta.dirname,
  dirs = fs.readdirSync(ROOT).filter((file) => {
    const fullPath = path.join(ROOT, file);
    return (
      fs.statSync(fullPath).isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules" &&
      file !== "conf" &&
      fs.existsSync(path.join(fullPath, "package.json"))
    );
  }),
  workspaces = {
    ".": {
      entry: ["_/hook/*.js", "_/rs/*.js", "./*.js"],
      ignoreDependencies: ["oxlint", "lint-staged", "@1-/mdcheck", "@3-/cargo_upgrade"],
    },
  };

for (const dir of dirs) {
  const pkgPath = path.join(ROOT, dir, "package.json"),
    pkg = JSON.parse(read(pkgPath));

  let config = pkg.knip;
  if (!config) {
    const jsPath = path.join(ROOT, dir, "knip.js");
    if (fs.existsSync(jsPath)) {
      const mod = await import(pathToFileURL(jsPath).href);
      config = mod.default;
    }
  }

  workspaces[dir] = config || { entry: ["test/*.js"] };
}

export default {
  workspaces,
  ignoreDependencies: ["@1-/minify_size", "@1-/new", "@1-/fix"],
  ignoreBinaries: ["version", "dump"],
  ignore: ["./new.js", "./conf/**", "_/conf/**", "**/knip.js", "_/rs/github_action/**"],
};
