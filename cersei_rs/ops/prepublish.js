#!/usr/bin/env bun
import read from "@3-/read";
import { writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import npm_org from "../src/npmOrg.js";

const ROOT = join(import.meta.dirname, ".."),
  root_pkg_path = join(ROOT, "package.json");

let root_pkg_name = "cersei_rs";

if (existsSync(root_pkg_path)) {
  const root_pkg = JSON.parse(read(root_pkg_path));
  root_pkg_name = root_pkg.name;

  if (root_pkg.optionalDependencies) {
    const new_opt_deps = {};
    for (const key of Object.keys(root_pkg.optionalDependencies)) {
      const new_key = key.startsWith("@" + npm_org + "/") ? key : "@" + npm_org + "/" + key;
      new_opt_deps[new_key] = root_pkg.version;
    }
    root_pkg.optionalDependencies = new_opt_deps;
  }

  writeFileSync(root_pkg_path, JSON.stringify(root_pkg, null, 2) + "\n", "utf-8");
  console.log("已更新根目录 package.json 的可选依赖（追加组织前缀）。");
}

// 2. 更新 npm/*/package.json 中的包名
const npm_dir = join(ROOT, "npm");
if (existsSync(npm_dir)) {
  const dirs = readdirSync(npm_dir);
  for (const dir of dirs) {
    const pkg_path = join(npm_dir, dir, "package.json");
    if (existsSync(pkg_path)) {
      const pkg = JSON.parse(read(pkg_path));
      if (pkg.name && !pkg.name.startsWith("@" + npm_org + "/")) {
        pkg.name = "@" + npm_org + "/" + pkg.name;
        writeFileSync(pkg_path, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        console.log("已更新 npm/" + dir + "/package.json 中的包名为 " + pkg.name);
      }
    }
  }
}

// 3. 更新 src/_.js，从组织作用域包导入
const js_path = join(ROOT, "src", "_.js");
if (existsSync(js_path)) {
  let content = read(js_path);
  if (!content.includes("import npm_org from './npmOrg.js'")) {
    content = "import npm_org from './npmOrg.js';\n" + content;
    // 将 "../npm/" 替换为 '@' + npm_org + '/' + root_pkg_name + '-'
    content = content.replace('"../npm/"', "'@' + npm_org + '/" + root_pkg_name + "-'");
    writeFileSync(js_path, content, "utf-8");
    console.log("已更新 src/_.js 中的导入路径（指向发布的组织包）。");
  }
}
