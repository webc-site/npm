import { join, relative } from "node:path";

export default (base_dir, db_list) =>
  db_list.map((db_path) => {
    const abs_db = join(base_dir, db_path);
    return [abs_db, join(base_dir, db_path + ".dump"), relative(base_dir, abs_db)];
  });
