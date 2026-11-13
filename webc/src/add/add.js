import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import md5B64 from "@3-/base64url/md5B64.js";
import ERR from "@3-/log/ERR.js";
import read from "@3-/read";
import write from "@3-/write";
import { cacheDump, cacheLoad } from "./cache.js";
import { repoParse, vTag } from "./cdn.js";
import { ghFetch, pkgJson } from "./fetch.js";
import fetchDep from "./fetchDep.js";
import fmt from "./fmt.js";
import specParse from "./spec.js";

const PREFIX = "src/";

export default async (webc_dir, raw_name) => {
  const [pkg_part, ver, comp_name] = specParse(raw_name),
    json = await pkgJson(pkg_part);

  if (!json) {
    ERR("failed to fetch package.json for " + pkg_part);
    return false;
  }

  const { repository, version } = json,
    repo = repoParse(repository);

  if (!repo) {
    ERR("failed to parse repository from package.json");
    return false;
  }

  const src_dir = dirname(webc_dir),
    csv_path = join(webc_dir, "cache.csv"),
    ver_str = (ver || version || "").replace(/^v/, ""),
    tag = vTag(ver_str),
    file_name = comp_name.endsWith(".js") ? comp_name : comp_name + ".js",
    rel_path = PREFIX + "webc/" + file_name,
    cache_map = await cacheLoad(csv_path);

  let found = false;

  const fetchFile = async (cur_path) => {
    if (!cur_path.startsWith(PREFIX)) return null;

    const file_rel = cur_path.slice(PREFIX.length),
      full_path = join(src_dir, file_rel);

    if (existsSync(full_path)) {
      const [csv_ver, csv_md5] = cache_map.get(file_rel) || [],
        old_raw = await read(full_path),
        old_code = await fmt(file_rel, old_raw),
        old_md5 = md5B64(old_code),
        is_same_ver = ver_str ? csv_ver === ver_str : Boolean(csv_ver);

      if (old_md5 !== csv_md5 || is_same_ver) {
        found = true;
        return old_code;
      }
    }

    const raw_code = await ghFetch(repo, tag, cur_path);
    if (!raw_code) return null;

    found = true;
    const new_code = await fmt(file_rel, raw_code),
      new_md5 = md5B64(new_code);

    write(full_path, new_code);
    cache_map.set(file_rel, [ver_str, new_md5]);
    console.log("→ " + file_rel);
    return new_code;
  };

  await fetchDep(fetchFile, rel_path);

  if (!found) {
    ERR("failed to fetch " + rel_path + " from " + repo + "@" + tag);
    return false;
  }

  await cacheDump(csv_path, cache_map);
  return true;
};
