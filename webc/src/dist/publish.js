import read from "@3-/read";
import ERR from "@3-/log/ERR.js";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import i18n from "../lib/i18n.js";
import isStr from "@3-/is_str";
import isPublished from "../lib/isPublished.js";

const I18N = i18n(import.meta),
  INIT_VER = "0.1.0",
  PKG_FILE = "package.json",
  npm = (dist_npm_dir, args) =>
    new Promise((resolve, reject) => {
      const child = spawn("npm", args, { cwd: dist_npm_dir, stdio: "inherit" });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error("npm " + args.join(" ") + " failed with code " + code));
        }
      });
    }),
  npmTrust = async (pkg_name, repo_url, dist_npm_dir) => {
    const match = repo_url.match(/github\.com\/([^/]+\/[^.]+)/);
    if (match) {
      const owner_repo = match[1];

      console.log(I18N.npmTrust + owner_repo + " npm.yml");
      try {
        await npm(dist_npm_dir, [
          "trust",
          "github",
          pkg_name,
          "--repo",
          owner_repo,
          "--file",
          "npm.yml",
          "--yes",
          "--allow-publish",
          "--allow-stage-publish"
        ]);
      } catch (trust_err) {
        ERR(I18N.errTrust + trust_err.message);
      }
    }
  };

export default async (root) => {
  const dist_npm_dir = join(root, "dist/npm"),
    pkg_path = join(dist_npm_dir, PKG_FILE);

  if (!existsSync(pkg_path)) {
    ERR(I18N.errNoPkg + pkg_path);
    return;
  }

  const [pkg_name, ver, published] = await isPublished(pkg_path);

  if (published) {
    console.log("Version " + ver + " is already published online.");
    return;
  }

  console.log(I18N.tryPub + pkg_name + "...");
  try {
    await npm(dist_npm_dir, ["publish", "--access", "public"]);
  } catch (err) {
    ERR("Failed to publish: " + err.message);
    throw err;
  }

  const root_pkg_path = join(root, PKG_FILE);
  if (!existsSync(root_pkg_path)) {
    return;
  }
  const root_pkg = JSON.parse(read(root_pkg_path)),
    { repository } = root_pkg,
    repo_url = isStr(repository) ? repository : repository ? repository.url : "";

  if (repo_url && repo_url.includes("github.com") && ver === INIT_VER) {
    await npmTrust(pkg_name, repo_url, dist_npm_dir);
  }
};
