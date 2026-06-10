#!/usr/bin/env bun
import read from "@3-/read";
import { writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import npmOrg from "./src/npmOrg.js";

const ROOT = import.meta.dirname,
  // 1. Update root package.json name and optionalDependencies
  rootPkgPath = join(ROOT, "package.json");
if (existsSync(rootPkgPath)) {
  const rootPkg = JSON.parse(read(rootPkgPath));

  if (!rootPkg.name.startsWith(`@${npmOrg}/`)) {
    rootPkg.name = `@${npmOrg}/${rootPkg.name}`;
  }

  if (rootPkg.optionalDependencies) {
    const newOptDeps = {};
    for (const [key, val] of Object.entries(rootPkg.optionalDependencies)) {
      const newKey = key.startsWith(`@${npmOrg}/`) ? key : `@${npmOrg}/${key}`;
      newOptDeps[newKey] = val;
    }
    rootPkg.optionalDependencies = newOptDeps;
  }

  writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n", "utf-8");
  console.log("Updated root package.json name and optionalDependencies with organization prefix.");
}

// 2. Update npm/*/package.json names
const npmDir = join(ROOT, "npm");
if (existsSync(npmDir)) {
  const dirs = readdirSync(npmDir);
  for (const dir of dirs) {
    const pkgPath = join(npmDir, dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(read(pkgPath));
      if (pkg.name && !pkg.name.startsWith(`@${npmOrg}/`)) {
        pkg.name = `@${npmOrg}/${pkg.name}`;
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        console.log(`Updated npm/${dir}/package.json name to ${pkg.name}`);
      }
    }
  }
}

// 3. Update src/_.js to import from scoped packages
const jsPath = join(ROOT, "src", "_.js");
if (existsSync(jsPath)) {
  let content = read(jsPath);
  if (!content.includes("import npmOrg from './npmOrg.js'")) {
    content = `import npmOrg from './npmOrg.js';\n` + content;
    // Replace ("../npm/" + PLATFORM + "/index.js") with ('@' + npmOrg + '/cersei_rs-' + PLATFORM)
    content = content.replace(
      /\(\s*["']\.\.\/npm\/["']\s*\+\s*PLATFORM\s*\+\s*["']\/index\.js["']\s*\)/,
      "('@' + npmOrg + '/cersei_rs-' + PLATFORM)",
    );
    writeFileSync(_.jsPath, content, "utf-8");
    console.log("Updated src/_.js import paths.");
  }
}
