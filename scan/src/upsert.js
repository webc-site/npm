import upsertMtime from "./upsertMtime.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import bufmd5 from "@1-/hash/bufmd5.js";
import strmd5 from "@1-/hash/strmd5.js";

export default (db_mtime, db_md5, dir) => {
  const upsert_mtime = upsertMtime(db_mtime, dir),
    insert_md5 = db_md5.prepare("INSERT OR REPLACE INTO scanMd5(hash,md5)VALUES(?,?)"),
    upsert = async (rel_path) => {
      try {
        await upsert_mtime(rel_path);
        const file_content = await readFile(join(dir, rel_path));
        insert_md5.run(strmd5(rel_path), bufmd5(file_content));
      } catch {}
    };
  upsert[Symbol.dispose] = () => {
    upsert_mtime[Symbol.dispose]();
    db_md5.close();
  };
  return upsert;
};
