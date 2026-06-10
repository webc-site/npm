import stat from "./stat.js";

export default (db, dir) => {
  const insert = db.prepare("INSERT OR REPLACE INTO scanMtimeLen(hash,size,mtime)VALUES(?,?,?)"),
    upsert = async (rel_path) => {
      try {
        const [size, mtime, hash] = await stat(dir, rel_path);
        insert.run(hash, size, mtime);
      } catch {}
    };
  upsert[Symbol.dispose] = () => db.close();
  return upsert;
};
