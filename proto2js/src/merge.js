import read from "@3-/read";
import { existsSync } from "node:fs";
import { join } from "node:path";
import importLi from "./importLi.js";

const parseImport = (package2proto, path, findPath) => {
    path = findPath(path);
    if (!path) {
      return [[], ""];
    }

    const [import_li, txt, package_name] = importLi(read(path));

    package2proto.set(package_name, txt + (package2proto.get(package_name) || ""));

    for (let n = 0; n < import_li.length; ++n) {
      const [_import_li] = parseImport(package2proto, import_li[n], findPath);
      import_li.push(..._import_li);
    }

    return [import_li, package_name];
  },
  pkgWrap = (li, txt) => li.reduceRight((acc, pkg) => "message " + pkg + "{\n" + acc + "\n}", txt);

export default (include_dir, proto_path) => {
  const processed = new Set(),
    findPath = (path) => {
      if (processed.has(path)) {
        return;
      }
      for (const dir of include_dir) {
        const file = join(dir, path);
        if (existsSync(file)) {
          processed.add(path);
          return file;
        }
      }
      throw new Error("file not found: " + path);
    },
    package2proto = new Map(),
    pkg_set = new Set(),
    pkg = parseImport(package2proto, proto_path, findPath)[1];

  return [
    'syntax = "proto3";\n' +
      [...package2proto.entries()]
        .map(([pkg, txt]) => {
          pkg_set.add(pkg + ".");
          return pkgWrap(pkg.split("."), txt);
        })
        .join("\n")
        .replaceAll(/syntax\s*=\s*"proto3"\s*;/g, ""),
    pkg_set,
    pkg
  ];
};
