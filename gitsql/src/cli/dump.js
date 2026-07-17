import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import dump from "../dump.js";
import scan from "../scan.js";
import cliPaths from "./paths.js";

/*
备份数据库
*/
export default async (base_dir, scan_db_path, db_list, abs_md5_db, abs_md5_dir) => {
  const [to_update_set, upsert] = await scan(base_dir, scan_db_path, db_list);

  {
    using _ = upsert;

    for (const [abs_db, abs_dir, rel_db] of cliPaths(base_dir, db_list)) {
      if (existsSync(abs_db) && to_update_set.has(rel_db)) {
        await dump(abs_db, abs_dir);
        await upsert(rel_db);
        spawnSync("git", ["add", abs_dir], { stdio: "inherit" });
      }
    }
  }

  if (existsSync(abs_md5_db)) {
    await dump(abs_md5_db, abs_md5_dir);
    spawnSync("git", ["add", abs_md5_dir], { stdio: "inherit" });
  }
};
