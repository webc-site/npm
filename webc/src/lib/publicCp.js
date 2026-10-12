import { cpSync } from "node:fs";
import { join } from "node:path";

export default (root, site_dir) => {
  cpSync(join(root, "public"), site_dir, { recursive: true });
};
