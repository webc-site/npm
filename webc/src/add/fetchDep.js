import { dirname, join } from "node:path/posix";
import ERR from "@3-/log/ERR.js";
import importLi from "@1-/jsparser/importLi.js";

const PREFIX = "src/",
  STYL_REG_LI = [
    /url\(\s*['"]?([^'")]+?\.svg)(#[^'")]*)?['"]?\s*\)/g,
    /@import\s+['"]?([^'"]+?)['"]?(?:\s*;|\s*$|\n)/g
  ],
  stylDep = (code, rel_path) => {
    const dep_li = [],
      dir = dirname(rel_path);

    for (const reg of STYL_REG_LI) {
      for (const m of code.matchAll(reg)) {
        const rel = m[1];
        if (rel?.startsWith(".")) {
          const next_path = join(dir, rel);
          if (next_path.startsWith(PREFIX)) dep_li.push(next_path);
        }
      }
    }
    return dep_li;
  };

export default async (fetchFile, start_path) => {
  const visited = new Set([start_path]);
  let queue = [start_path];

  while (queue.length) {
    const batch = queue;
    queue = [];

    const res_li = await Promise.all(
      batch.map(async (rel_path) => [rel_path, await fetchFile(rel_path)])
    );

    for (const [rel_path, code] of res_li) {
      if (!code) continue;

      const dir = dirname(rel_path);
      if (rel_path.endsWith(".js")) {
        try {
          const [static_li, dynamic_li] = importLi(code);
          for (const imp of static_li.concat(dynamic_li)) {
            if (imp.startsWith(".")) {
              const next_path = join(dir, imp);
              if (next_path.startsWith(PREFIX) && !visited.has(next_path)) {
                visited.add(next_path);
                queue.push(next_path);
              }
            }
          }
        } catch (err) {
          ERR(rel_path, err);
        }
      } else if (rel_path.endsWith(".styl")) {
        for (const next_path of stylDep(code, rel_path)) {
          if (!visited.has(next_path)) {
            visited.add(next_path);
            queue.push(next_path);
          }
        }
      }
    }
  }
};
