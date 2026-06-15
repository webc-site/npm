import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import dump from "../dump.js";
import scan from "../scan.js";

const DOT_DUMP = ".dump";

/*
备份数据库
*/
export default async (base_dir, scan_db_path, db_list, abs_md5_db, abs_md5_dir) => {
  const [to_update_set, upsert] = await scan(base_dir, scan_db_path, db_list);

  {
    using _ = upsert;

    for (const db_path of db_list) {
      const dir_path = db_path + DOT_DUMP,
        abs_db = join(base_dir, db_path),
        abs_dir = join(base_dir, dir_path),
        rel_db = relative(base_dir, abs_db);

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
