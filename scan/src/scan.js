import { BinSet } from "@3-/binset";
import u8eq from "@3-/u8/u8eq.js";
import vbE from "@3-/vb/vbE.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import bufmd5 from "@1-/hash/bufmd5.js";
import stat from "./stat.js";

export default async (dir, files, existing, limit, db_mtime, db_md5) => {
  const scanned = new BinSet(),
    update = [],
    get_md5 = db_md5.prepare("SELECT md5 FROM scanMd5 WHERE hash = ?"),
    update_mtime = db_mtime.prepare(
      "INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)",
    );

  await Promise.all(
    files.map((rel_path) =>
      limit(async () => {
        try {
          const [size, mtime, hash] = await stat(dir, rel_path),
            val = existing.get(hash);

          scanned.add(hash);

          if (!val) {
            update.push(rel_path);
          } else if (!u8eq(val, vbE([size, mtime]))) {
            const row = get_md5.get(hash);
            if (row) {
              const file_content = await readFile(join(dir, rel_path)),
                cur_md5 = bufmd5(file_content);
              if (u8eq(row.md5, cur_md5)) {
                update_mtime.run(hash, size, mtime);
                return;
              }
            }
            update.push(rel_path);
          }
        } catch {}
      }),
    ),
  );
  return [scanned, update];
};
