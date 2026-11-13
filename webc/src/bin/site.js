import { join } from "node:path";
import siteGen from "../site/gen.js";
import publicCp from "../lib/publicCp.js";

export default async (root, site = "site") => {
  await siteGen(root, site);
  publicCp(root, join(root, "dist", site));
};
