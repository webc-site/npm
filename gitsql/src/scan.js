import { join } from "node:path";
import Scan from "@1-/scan";

export default async (base_dir, scan_db_path, db_list) => {
  const len = base_dir.length + 1,
    files = db_list.map((p) => join(base_dir, p).slice(len)),
    [to_update, upsert] = await Scan(base_dir, scan_db_path, files);

  return [new Set(to_update), upsert];
};
