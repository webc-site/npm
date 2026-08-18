import { existsSync } from "node:fs";
import { join } from "node:path";
import read from "@3-/read";
import importLi from "./importLi.js";

const parseImport = (pkg_proto, path, findPath) => {
    path = findPath(path);
    if (!path) {
      return [[], ""];
    }

    const [import_li, txt, package_name] = importLi(read(path));

    pkg_proto.set(package_name, txt + (pkg_proto.get(package_name) || ""));

    for (let n = 0; n < import_li.length; ++n) {
      const [sub_import_li] = parseImport(pkg_proto, import_li[n], findPath);
      import_li.push(...sub_import_li);
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
    pkg_proto = new Map(),
    pkg_set = new Set(),
    pkg = parseImport(pkg_proto, proto_path, findPath)[1];

  return [
    'syntax = "proto3";\n' +
      [...pkg_proto.entries()]
        .map(([pkg, txt]) => {
          if (pkg) {
            pkg_set.add(pkg + ".");
            return pkgWrap(pkg.split("."), txt);
          }
          return txt;
        })
        .join("\n")
        .replaceAll(/syntax\s*=\s*"proto3"\s*;/g, ""),
    pkg_set,
    pkg
  ];
};
