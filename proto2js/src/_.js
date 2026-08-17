import write from "@3-/write";
import { resolve, dirname, join } from "node:path";
import gen from "./gen.js";
import merge from "./merge.js";
import { cwd } from "node:process";
import { existsSync, statSync } from "node:fs";
import walk from "@3-/walk";

export const IMPORT = [join(import.meta.dirname, "import")];

const genFile = (proto_path, out_dir, include_dir, funcId) => {
  const proto_dir = dirname(proto_path),
    inc = new Set(include_dir);
  inc.add(proto_dir);

  const rel_proto_path = proto_path.slice(proto_dir.length + 1),
    [proto_src, pkg_set, pkg] = merge(inc, rel_proto_path);
  let r;

  try {
    r = gen(proto_src, pkg_set, funcId);
  } catch (e) {
    console.error("❌ " + proto_path);
    throw e;
  }

  r.forEach(([k, v]) => {
    write(join(out_dir, k + ".js"), v);
  });
  return pkg;
};

export default (proto_path, out_dir, include_dir, funcId = (i) => JSON.stringify(i)) => {
  include_dir = new Set(IMPORT.concat(include_dir || []));

  if (!proto_path.startsWith("/")) {
    proto_path = resolve(join(cwd(), proto_path));
  }

  if (!existsSync(proto_path)) {
    throw new Error("file not found: " + proto_path);
  }

  const is_dir = statSync(proto_path).isDirectory();
  out_dir = out_dir || (is_dir ? proto_path : dirname(proto_path));

  if (is_dir) {
    include_dir.add(proto_path);
    const pkg_li = [];
    for (const file of walk(proto_path)) {
      if (file.endsWith(".proto")) {
        pkg_li.push(genFile(file, out_dir, include_dir, funcId));
      }
    }
    return pkg_li;
  }

  return genFile(proto_path, out_dir, include_dir, funcId);
};
