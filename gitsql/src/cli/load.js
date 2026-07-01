import { existsSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import load from "../load.js";
import scan from "../scan.js";

const DOT_DUMP = ".dump";

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

    for (const db_path of db_list) {
      const dir_path = db_path + DOT_DUMP,
        abs_db = join(base_dir, db_path),
        abs_dir = join(base_dir, dir_path),
        rel_db = relative(base_dir, abs_db);

      if (existsSync(abs_dir)) {
        await load(abs_dir, abs_db);
        if (existsSync(abs_db)) {
          await upsert(rel_db);
        }
      }
    }
  }
};
