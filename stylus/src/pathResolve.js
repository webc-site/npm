import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { ext, isUrl } from "./resolve.js";

const RESOLVE_CACHE = new Map(),
  FS_EXIST_CACHE = new Map(),
  cachedExists = (path) => {
    let res = FS_EXIST_CACHE.get(path);
    if (res === undefined) {
      res = existsSync(path);
      FS_EXIST_CACHE.set(path, res);
    }
    return res;
  },
  findUp = (start_dir, check) => {
    let dir = start_dir;
    for (;;) {
      const res = check(dir);
      if (res !== undefined) {
        return res;
      }
      const parent = dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  };

/*
解析导入路径的真实绝对路径

import_path: 导入的相对路径/绝对路径/URL
current_dir: 当前文件所在目录
lookup_paths: 依赖搜索路径列表

返回: 解析后的文件绝对路径或原 URL
*/
export default (import_path, current_dir, lookup_paths) => {
  if (isUrl(import_path)) {
    return import_path;
  }

  const cache_key = import_path + "\0" + current_dir;
  if (RESOLVE_CACHE.has(cache_key)) {
    return RESOLVE_CACHE.get(cache_key);
  }

  let resolved;
  if (import_path.startsWith("/")) {
    const trial = ext(import_path);
    resolved = cachedExists(trial)
      ? trial
      : findUp(current_dir, (dir) => {
          if (
            cachedExists(resolve(dir, "package.json")) ||
            cachedExists(resolve(dir, "node_modules"))
          ) {
            const trial_root = ext(resolve(dir, import_path.slice(1)));
            if (cachedExists(trial_root)) {
              return trial_root;
            }
          }
        });
  }

  if (resolved === undefined) {
    const local_paths = [current_dir, ...lookup_paths.filter((path) => path !== current_dir)];
    for (const dir of local_paths) {
      const trial = ext(resolve(dir, import_path));
      if (cachedExists(trial)) {
        resolved = trial;
        break;
      }
    }

    if (resolved === undefined) {
      resolved =
        findUp(current_dir, (dir) => {
          const trial = ext(resolve(dir, "node_modules", import_path));
          if (cachedExists(trial)) {
            return trial;
          }
        }) || ext(resolve(current_dir, import_path));
    }
  }

  RESOLVE_CACHE.set(cache_key, resolved);
  return resolved;
};
