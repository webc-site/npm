import { existsSync, mkdirSync } from "node:fs";
import load from "../load.js";
import scan from "../scan.js";
import cliPaths from "./paths.js";

/*
还原数据库
*/
export default async (base_dir, scan_db_path, db_list, abs_md5_db, abs_md5_dir) => {
  if (existsSync(abs_md5_dir)) {
    mkdirSync(scan_db_path, { recursive: true });
    await load(abs_md5_dir, abs_md5_db);
  }

  const [_, upsert] = await scan(base_dir, scan_db_path, db_list);

  {
    using _ = upsert;

    for (const [abs_db, abs_dir, rel_db] of cliPaths(base_dir, db_list)) {
      if (existsSync(abs_dir)) {
        await load(abs_dir, abs_db);
        if (existsSync(abs_db)) {
          await upsert(rel_db);
        }
      }
    }
  }
};
