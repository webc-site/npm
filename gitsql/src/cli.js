#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import find from "@1-/find";
import ERR from "@3-/log/ERR.js";
import upsertGitignore from "@1-/upsert_gitignore";
import scan from "./scan.js";
import dump from "./dump.js";
import load from "./load.js";

const DUMP = "dump",
  LOAD = "load",
  DOT_DUMP = ".dump",
  GITSQL_JS = "gitsql.js",
  configLoad = async (base_dir) => {
    const config_path = join(base_dir, GITSQL_JS);
    if (existsSync(config_path)) {
      const { default: list } = await import("file://" + config_path);
      return list;
    }
    return [];
  },
  cliRun = async (cmd, base_dir, db_list) => {
    if (db_list.length === 0) return;
    const scan_db_path = join(base_dir, ".cache/gitsql/scan"),
      cache_dir = dirname(scan_db_path),
      gitignore_path = join(cache_dir, ".gitignore");
    mkdirSync(cache_dir, { recursive: true });
    upsertGitignore(gitignore_path, ["/scan"]);

    const [to_update_set, upsert] = await scan(base_dir, scan_db_path, db_list);

    using _ = upsert;

    for (const db_path of db_list) {
      const dir_path = db_path + DOT_DUMP,
        abs_db = join(base_dir, db_path),
        abs_dir = join(base_dir, dir_path),
        rel_db = relative(base_dir, abs_db);

      if (cmd === DUMP) {
        if (existsSync(abs_db)) {
          if (to_update_set.has(rel_db)) {
            await dump(abs_db, abs_dir);
            await upsert(rel_db);
            spawnSync("git", ["add", abs_dir], { stdio: "inherit" });
          }
        }
      } else {
        if (existsSync(abs_dir)) {
          await load(abs_dir, abs_db);
          if (existsSync(abs_db)) {
            await upsert(rel_db);
          }
        }
      }
    }
  },
  run = async () => {
    const args = process.argv.slice(2),
      cmd = args[0];

    if (cmd !== DUMP && cmd !== LOAD) {
      ERR("Usage: bun run src/cli.js <dump|load>");
      process.exit(1);
    }

    const base_dir = find(process.cwd(), GITSQL_JS) || process.cwd(),
      db_list = await configLoad(base_dir);

    await cliRun(cmd, base_dir, db_list);
  };

run();
