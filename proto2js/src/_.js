import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ERR from "@3-/log/ERR.js";
import walk from "@3-/walk";
import write from "@3-/write";
import gen from "./gen.js";
import merge from "./merge.js";

const IMPORT = [join(import.meta.dirname, "import")],
  genFile = (proto_path, out_dir, include_dir, funcId) => {
    const proto_dir = dirname(proto_path),
      inc = new Set(include_dir).add(proto_dir),
      rel_proto_path = proto_path.slice(proto_dir.length + 1),
      [proto_src, pkg_set, pkg] = merge(inc, rel_proto_path);
    let r;

    try {
      r = gen(proto_src, pkg_set, funcId);
    } catch (e) {
      ERR("❌ " + proto_path);
      throw e;
    }

    r.forEach(([k, v]) => write(join(out_dir, k + ".js"), v));
    return pkg;
  };

export default (proto_path, out_dir, include_dir, funcId = (i) => JSON.stringify(i)) => {
  include_dir = new Set([...IMPORT, ...(include_dir || [])]);
  proto_path = resolve(proto_path);

  if (!existsSync(proto_path)) {
    throw new Error("file not found: " + proto_path);
  }

  const is_dir = statSync(proto_path).isDirectory(),
    out = out_dir || (is_dir ? proto_path : dirname(proto_path));

  if (is_dir) {
    include_dir.add(proto_path);
    return [...walk(proto_path)]
      .filter((file) => file.endsWith(".proto"))
      .map((file) => genFile(file, out, include_dir, funcId));
  }

  return genFile(proto_path, out, include_dir, funcId);
};
