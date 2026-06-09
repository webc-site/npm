import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import find from "@1-/find";
import ERR from "@3-/log/ERR.js";
import dump from "./dump.js";
import load from "./load.js";

const run = async () => {
  const args = process.argv.slice(2),
    cmd = args[0];

  if (cmd !== "dump" && cmd !== "load") {
    ERR("Usage: bun run src/cli.js <dump|load>");
    process.exit(1);
  }

  const base_dir = find(process.cwd(), "gitsql.js") || process.cwd(),
    config_path = join(base_dir, "gitsql.js");

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
};

run();
