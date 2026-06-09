import { spawnSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import ERR from "@3-/log/ERR.js";
import dump from "./sqliteDump.js";
import load from "./sqliteLoad.js";

const find = async (dir, results = []) => {
    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (file === "node_modules" || file === ".git" || file === ".husky") {
          continue;
        }
        const full = join(dir, file),
          info = await stat(full);
        if (info.isDirectory()) {
          await find(full, results);
        } else if (file === "gitsql.js") {
          results.push(full);
        }
      }
    } catch {}
    return results;
  },
  run = async () => {
    const args = process.argv.slice(2),
      cmd = args[0];

    if (cmd !== "dump" && cmd !== "load") {
      ERR("Usage: bun run src/cli.js <dump|load>");
      process.exit(1);
    }

    const config_files = await find(process.cwd());

    if (config_files.length === 0) {
      const default_config = join(process.cwd(), "gitsql.js");
      config_files.push(default_config);
    }

    for (const config_path of config_files) {
      const base_dir = dirname(config_path);
      let db_list = [];

      if (existsSync(config_path)) {
        const { default: list } = await import("file://" + config_path);
        if (Array.isArray(list)) {
          db_list = list;
        }
      } else {
        db_list = [{ db: "db.sqlite", dir: "db_dir" }];
      }

      for (const item of db_list) {
        let db_path = "",
          dir_path = "";

        if (typeof item === "string") {
          db_path = item;
          dir_path = item + "_dir";
        } else if (item && typeof item === "object") {
          db_path = item.db;
          dir_path = item.dir || item.db + "_dir";
        }

        if (!db_path) {
          continue;
        }

        const abs_db = join(base_dir, db_path),
          abs_dir = join(base_dir, dir_path);

        if (cmd === "dump") {
          if (existsSync(abs_db)) {
            await dump(abs_db, abs_dir);
            spawnSync("git", ["add", abs_dir], { stdio: "inherit" });
          }
        } else {
          if (existsSync(abs_dir)) {
            await load(abs_dir, abs_db);
          }
        }
      }
    }
  };

run();
