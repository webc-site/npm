import { mkdir, readdir, cp, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import rJson from "@3-/read/rJson.js";
import pkgJsonClean from "./pkgJsonClean.js";

export const PKG_NAME = 0,
  TMP_DIR = 1,
  PKG_JSON = 2,
  PKG_JSON_PATH = 3,
  CURRENT_VERSION = 4,
  NEXT_VERSION = 5;

export default async (pkg_path, pkg_folder, src_dir) => {
  const pkg_json_path = join(pkg_path, "package.json"),
    pkg_json = rJson(pkg_json_path),
    { name: pkg_name, version: current_version } = pkg_json,
    version_parts = current_version.split(".");

  version_parts[2] = String(Number(version_parts[2]) + 1);
  const next_version = version_parts.join("."),
    tmp_dir = join(tmpdir(), "npm-publish-" + pkg_folder + "-" + crypto.randomUUID()),
    src_path = join(pkg_path, src_dir);

  await mkdir(tmp_dir, { recursive: true });

  if (existsSync(src_path)) {
    const entries = await readdir(src_path);
    await Promise.all(
      entries.map((entry) => cp(join(src_path, entry), join(tmp_dir, entry), { recursive: true })),
    );
  }

  const cleaned_pkg = pkgJsonClean(pkg_json, current_version);
  await writeFile(join(tmp_dir, "package.json"), JSON.stringify(cleaned_pkg, null, 2) + "\n");

  return [pkg_name, tmp_dir, pkg_json, pkg_json_path, current_version, next_version];
};
