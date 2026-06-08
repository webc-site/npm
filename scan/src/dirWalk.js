import { stat } from "node:fs/promises";
import { join } from "node:path";
import { FILE } from "@1-/walk";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import { BinSet } from "@3-/binset";
import u8eq from "@3-/u8/u8eq.js";
import vbE from "@3-/vb/vbE.js";
import int from "@3-/int";
import hash from "./hash.js";

export default async (dir, existing) => {
  const scanned = new BinSet(),
    to_update = [];

  await walkRelIgnore(dir, async (kind, rel_path) => {
    if (kind === FILE) {
      const { size, mtimeMs } = await stat(join(dir, rel_path)),
        mtime = int(mtimeMs),
        h = hash(rel_path);

      scanned.add(h);

      const val = existing.get(h);
      if (val && u8eq(val, vbE([size, mtime]))) {
        return;
      }
      to_update.push([h, size, mtime]);
    }
  });

  return [scanned, to_update];
};
