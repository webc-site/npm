import { BinSet } from "@3-/binset";
import u8eq from "@3-/u8/u8eq.js";
import vbE from "@3-/vb/vbE.js";
import stat from "./stat.js";

export default async (dir, files, existing, limit) => {
  const scanned = new BinSet(),
    update = [];
  await Promise.all(
    files.map((rel_path) =>
      limit(async () => {
        try {
          const [size, mtime, hash] = await stat(dir, rel_path),
            val = existing.get(hash);

          scanned.add(hash);

          if (!val || !u8eq(val, vbE([size, mtime]))) {
            update.push(rel_path);
          }
        } catch {}
      }),
    ),
  );
  return [scanned, update];
};
