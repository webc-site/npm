import { mkdir, readdir, cp, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import rJson from "@3-/read/rJson.js";
import pkgJsonClean from "@1-/package_clean";
import npmver from "@1-/npmver";
import vernext from "@1-/vernext";

export const PKG_NAME = 0,
  TMP_DIR = 1,
  PKG_JSON = 2,
  PKG_JSON_PATH = 3,
  CURRENT_VERSION = 4,
  NEXT_VERSION = 5;

export default async (pkg_path, pkg_folder, src_dir) => {
  const pkg_json_path = join(pkg_path, "package.json"),
    pkg_json = rJson(pkg_json_path),
    { name: pkg_name, version: local_version } = pkg_json,
    npm_version = await npmver(pkg_name),
    current_version = npm_version || local_version,
    next_version = vernext(current_version),
    tmp_dir = join(tmpdir(), "npm-publish-" + pkg_folder + "-" + crypto.randomUUID()),
    src_path = join(pkg_path, src_dir);

  await mkdir(tmp_dir, { recursive: true });

  if (existsSync(src_path)) {
    const entries = await readdir(src_path);
    await Promise.all(
      entries.map((entry) => cp(join(src_path, entry), join(tmp_dir, entry), { recursive: true }))
    );
  }

  const srcReplace = (val) => {
      if (val?.constructor === String) {
        return val.replaceAll("./src/", "./");
      }
      if (val?.constructor === Array) {
        return val.map(srcReplace);
      }
      return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, srcReplace(v)]));
    },
    cleaned_pkg = pkgJsonClean(pkg_json);
  ["exports", "bin", "files", "main", "module", "types"].forEach((key) => {
    if (cleaned_pkg[key]) {
      cleaned_pkg[key] = srcReplace(cleaned_pkg[key]);
    }
  });
  await writeFile(join(tmp_dir, "package.json"), JSON.stringify(cleaned_pkg, null, 2) + "\n");

  return [pkg_name, tmp_dir, pkg_json, pkg_json_path, current_version, next_version];
};
