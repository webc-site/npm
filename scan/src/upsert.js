import { readFile } from "node:fs/promises";
import { join } from "node:path";
import bufmd5 from "@1-/hash/bufmd5.js";
import stat from "./stat.js";

export default (db_mtime, db_md5, dir) => {
  const insert_mtime = db_mtime.query(
      "INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)",
    ),
    insert_md5 = db_md5.query("INSERT OR REPLACE INTO scanMd5(hash,md5)VALUES(?,?)"),
    upsert = async (rel_path) => {
      try {
        const [size, mtime, hash] = await stat(dir, rel_path),
          file_content = await readFile(join(dir, rel_path));
        insert_mtime.run(hash, size, mtime);
        insert_md5.run(hash, bufmd5(file_content));
      } catch {}
    };
  upsert[Symbol.dispose] = () => {
    db_mtime.close();
    db_md5.close();
  };
  return upsert;
};
