import { existsSync } from "node:fs";
import { join } from "node:path";
import read from "@3-/read";
import importLi from "./importLi.js";

const parseImport = (pkg_proto, path, findPath) => {
    path = findPath(path);
    if (!path) return "";

    const [import_li, txt, package_name] = importLi(read(path));

    pkg_proto.set(package_name, txt + (pkg_proto.get(package_name) || ""));
    import_li.forEach((p) => parseImport(pkg_proto, p, findPath));

    return package_name;
  },
  treeMerge = (pkg_proto, pkg_set) => {
    const newNode = () => ({ txt: "", map: new Map() }),
      root = newNode();
    for (const [pkg, txt] of pkg_proto) {
      if (!pkg) {
        root.txt += txt + "\n";
        continue;
      }
      pkg_set.add(pkg + ".");
      let curr = root;
      for (const part of pkg.split(".")) {
        let next = curr.map.get(part);
        if (!next) {
          curr.map.set(part, (next = newNode()));
        }
        curr = next;
      }
      curr.txt += txt + "\n";
    }

    const render = (node) => {
      let res = node.txt;
      for (const [name, child] of node.map) {
        res += "\nmessage " + name + " {\n" + render(child) + "\n}\n";
      }
      return res;
    };

    return render(root);
  };

export default (include_dir, proto_path) => {
  const processed = new Set(),
    findPath = (path) => {
      if (processed.has(path)) return;
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
    pkg = parseImport(pkg_proto, proto_path, findPath);

  return [
    'syntax = "proto3";\n' +
      treeMerge(pkg_proto, pkg_set).replaceAll(/syntax\s*=\s*"proto3"\s*;/g, ""),
    pkg_set,
    pkg
  ];
};
