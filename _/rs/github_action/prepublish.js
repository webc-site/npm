#!/usr/bin/env bun
import read from "@3-/read";
import { writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const write = (path, val) => writeFileSync(path, val, "utf-8"),
  writeJson = (path, val) => write(path, JSON.stringify(val, null, 2) + "\n"),
  argv = yargs(hideBin(process.argv))
    .usage("Usage: $0 <PROJECT>")
    .demandCommand(1, "PROJECT is required")
    .parseSync(),
  project = argv._[0].toString(),
  ROOT = resolve(import.meta.dirname, "../../..", project),
  root_pkg_path = join(ROOT, "package.json"),
  npm_dir = join(ROOT, "npm"),
  js_path = join(ROOT, "src", "native.js"),
  { default: npm_org } = await import(join(ROOT, "src", "npmOrg.js")),
  // 1. 更新根目录 package.json 中的可选依赖与子包包名
  root_pkg = JSON.parse(read(root_pkg_path)),
  root_pkg_name = root_pkg.name;
root_pkg.optionalDependencies = {};

for (const dir of readdirSync(npm_dir)) {
  const pkg_path = join(npm_dir, dir, "package.json");
  if (existsSync(pkg_path)) {
    // 增加可选依赖项
    const key = "@" + npm_org + "/" + root_pkg_name + "-" + dir;
    root_pkg.optionalDependencies[key] = root_pkg.version;

    // 修改子包包名
    const pkg = JSON.parse(read(pkg_path));
    if (pkg.name && !pkg.name.startsWith("@" + npm_org + "/")) {
      pkg.name = "@" + npm_org + "/" + pkg.name;
      writeJson(pkg_path, pkg);
      console.log("已更新 npm/" + dir + "/package.json 中的包名为 " + pkg.name);
    }
  }
}

writeJson(root_pkg_path, root_pkg);
console.log("已更新根目录 package.json 的可选依赖（追加组织前缀）。");

// 3. 更新 src/native.js，从组织作用域包导入
let content = read(js_path);
if (!content.includes("import npm_org from './npmOrg.js'")) {
  content = "import npm_org from './npmOrg.js';\n" + content;
  // 将 "../npm/" 替换为 '@' + npm_org + '/' + root_pkg_name + '-'
  content = content.replace('"../npm/"', "'@' + npm_org + '/" + root_pkg_name + "-'");
  write(js_path, content);
  console.log("已更新 src/native.js 中的导入路径（指向发布的组织包）。");
}
