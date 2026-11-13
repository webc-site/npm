import { env } from "node:process";
import { join } from "node:path";
import site from "./site.js";
import srv from "../lib/srv.js";

const SITE = "site";

export default async (root, port = env.SITE_SRV_PORT || 8889) => {
  await site(root, SITE);
  await srv(root, join(root, "dist", SITE), port);
};
