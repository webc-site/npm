import { join } from "node:path";
import { existsSync } from "node:fs";
import read from "@3-/read";
import write from "@3-/write";
import vernext from "@1-/vernext";
import npmver from "@1-/npmver";
import npm from "./npm.js";
import publish from "../dist/publish.js";
import commitPushTag from "../lib/git/commitPushTag.js";

const PKG_FILE = "package.json",
  INIT_VER = "0.1.0",
  verVal = (v) => v.split(".").map(Number),
  verCmp = (v1, v2) => {
    const [a1, b1, c1] = verVal(v1),
      [a2, b2, c2] = verVal(v2);
    return a1 !== a2 ? a1 - a2 : b1 !== b2 ? b1 - b2 : c1 - c2;
  };

export default async (root) => {
  const root_pkg_path = join(root, PKG_FILE);
  if (!existsSync(root_pkg_path)) {
    return;
  }

  const root_pkg = JSON.parse(read(root_pkg_path)),
    { name: pkg_name, version: ver } = root_pkg;

  let online;
  try {
    online = await npmver(pkg_name);
  } catch {}

  let next;
  if (ver === INIT_VER && !online) {
    next = INIT_VER;
  } else {
    const local_next = vernext(ver);
    if (online && verCmp(local_next, online) < 0) {
      next = vernext(online);
    } else {
      next = local_next;
    }
  }

  await npm(root);

  const dist_pkg_path = join(root, "dist", "npm", PKG_FILE);
  if (existsSync(dist_pkg_path)) {
    const dist_pkg = JSON.parse(read(dist_pkg_path));
    dist_pkg.version = next;
    write(dist_pkg_path, JSON.stringify(dist_pkg, null, 2) + "\n");
  }

  await publish(root);

  root_pkg.version = next;
  write(root_pkg_path, JSON.stringify(root_pkg, null, 2) + "\n");
  console.log("published " + pkg_name + "@" + next + " successfully!");

  await commitPushTag(root, next);
};
