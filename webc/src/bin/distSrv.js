import { env } from "node:process";
import { join } from "node:path";
import dist from "./dist.js";
import srv from "../lib/srv.js";

const DIST = "dist";

export default async (root, port = env.DIST_SRV_PORT || 8890) => {
  await dist(root);
  await srv(root, join(root, "dist", DIST), port);
};
