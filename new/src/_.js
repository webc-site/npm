import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import { cp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FILE } from "@1-/walk";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import findGit from "@1-/findgit";

const run = promisify(exec);

export default async (dst, name, tmpl) => {
  const root = findGit(process.cwd()) || findGit(import.meta.dirname),
    dir = tmpl || (root ? join(root, "_tmpl") : join(import.meta.dirname, "../../_tmpl"));

  await cp(dir, dst, { recursive: true });

  await walkRelIgnore(dst, async (kind, rel) => {
    if (kind === FILE) {
      const file = join(dst, rel),
        txt = await readFile(file, "utf8"),
        re = /\btmpl\b/g;

      if (re.test(txt)) {
        await writeFile(file, txt.replace(re, name), "utf8");
      }
    }
  });

  try {
    await run("git add .", { cwd: dst });
  } catch {}
};
