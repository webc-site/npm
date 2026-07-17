#!/usr/bin/env bun
import read from "@1-/read";
import { cd, $ } from "zx";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { existsSync, promises as fs } from "node:fs";
import { join } from "node:path";
import npmDist from "@1-/dist/run.js";
import rsDist from "./_/rs/dist.js";
import log from "@3-/log";
import ERR from "@3-/log/ERR.js";

const ROOT = import.meta.dirname,
  argv = await yargs(hideBin(process.argv))
    .usage("Usage: $0 <PROJECT>")
    .demandCommand(1, "PROJECT is required")
    .help().argv,
  project = argv._[0];

cd(ROOT);
$.verbose = true;

const semverLt = (v1, v2) => {
    const clean = (v) => v.replace(/^[\^~*v]/, "").trim(),
      a = clean(v1).split(".").map(Number),
      b = clean(v2).split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); ++i) {
      const na = a[i] || 0,
        nb = b[i] || 0;
      if (na < nb) return true;
      if (na > nb) return false;
    }
    return false;
  },
  find = async (root, name) => {
    const dirs = existsSync(join(root, "package.json")) ? [root] : [],
      entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dir_name = entry.name;
        if (!dir_name.startsWith(".") && dir_name !== "node_modules" && dir_name !== "_tmpl") {
          const sub_path = join(root, dir_name);
          if (existsSync(join(sub_path, "package.json"))) {
            dirs.push(sub_path);
          }
        }
      }
    }

    const res = [],
      dep_types = ["dependencies", "devDependencies", "peerDependencies"];
    for (const dir of dirs) {
      try {
        const p_json_path = join(dir, "package.json"),
          pkg_json = JSON.parse(await read(p_json_path));
        let has_dep = false;
        for (const type of dep_types) {
          if (pkg_json[type] && pkg_json[type][name]) {
            has_dep = true;
            break;
          }
        }
        if (has_dep) {
          res.push([dir, p_json_path]);
        }
      } catch {
        // Ignore
      }
    }
    return res;
  },
  ncu = async (dir) => {
    log("Running ncu in " + (dir === ROOT ? "ROOT" : dir) + "...");
    cd(dir);
    await $`ncu -u --dep prod,dev,peer`;
  },
  up = async (dir, path, name, ver) => {
    try {
      const content = await read(path),
        pkg_json = JSON.parse(content),
        dep_types = ["dependencies", "devDependencies", "peerDependencies"];
      let updated = false;
      for (const type of dep_types) {
        if (pkg_json[type] && pkg_json[type][name]) {
          const val = pkg_json[type][name];
          if (semverLt(val, ver)) {
            const match = val.match(/^([\^~*v]?)/),
              prefix = match ? match[1] : "^";
            pkg_json[type][name] = prefix + ver;
            updated = true;
          }
        }
      }
      if (updated) {
        await fs.writeFile(path, JSON.stringify(pkg_json, null, 2) + "\n");
        log("Manually updated " + name + " in " + path + " to " + ver);
      }
    } catch (e) {
      ERR("Failed to update package.json in " + dir, e);
    }
  },
  install = async () => {
    log("Cleaning bun.lock files and reinstalling dependencies...");
    try {
      await $`fd -g bun.lock -x rm`;
    } catch {
      // Ignore
    }
    await $`bun i`;
    await $`git add .`;
  };

let pkg_name, current_version;
const pkg_json_path = join(ROOT, project, "package.json");
if (existsSync(pkg_json_path)) {
  try {
    const pkg_json = JSON.parse(await read(pkg_json_path));
    pkg_name = pkg_json.name;
    current_version = pkg_json.version;
  } catch (e) {
    ERR("Failed to read package.json for project " + project, e);
  }
}

if (existsSync(join(project, "Cargo.toml"))) {
  await rsDist(project);
} else {
  await npmDist(ROOT, project);

  if (pkg_name && current_version) {
    log(
      "\n--- Starting targeted upgrade for dependent projects of " +
        pkg_name +
        "@" +
        current_version +
        " ---"
    );

    const deps = await find(ROOT, pkg_name);
    if (deps.length > 0) {
      const names = deps
        .map(([dir]) => (dir === ROOT ? "ROOT" : join(dir).replace(ROOT + "/", "")))
        .join(", ");
      log("Found dependent projects: " + names);

      for (const [dir] of deps) {
        await ncu(dir);
      }
      cd(ROOT);

      for (const [dir, path] of deps) {
        await up(dir, path, pkg_name, current_version);
      }

      await install();
    } else {
      log("No dependent projects found for " + pkg_name + ".");
    }
  } else {
    log("Could not determine package name or version, skipping ncu upgrade.");
  }
}
