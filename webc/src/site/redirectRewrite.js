import { join } from "node:path";
import { existsSync } from "node:fs";
import read from "@3-/read";

export default async (dir) => {
  const redirects_path = join(dir, "_redirects"),
    rewrites = [];

  if (existsSync(redirects_path)) {
    const content = await read(redirects_path);
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [source, dest, status] = trimmed.split(/\s+/);
      if (status === "200") {
        rewrites.push({
          source,
          destination: dest === "/" ? "/index.html" : dest
        });
      }
    }
  }

  return rewrites;
};
