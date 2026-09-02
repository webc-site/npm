import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { availableParallelism } from "node:os";
import pLimit from "@3-/plimit";

export const DIR = 1,
  FILE = 2;

const walk = async (dir, parse, run) => {
  const files = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    files.map(async (file) => {
      const { name } = file,
        is_dir = file.isDirectory();
      if (is_dir || file.isFile()) {
        const file_path = join(dir, name),
          call = () => parse(is_dir ? DIR : FILE, file_path),
          has_next = await run(call);
        if (has_next !== false && is_dir) {
          await walk(file_path, parse, run);
        }
      }
    })
  );
};

export default (dir, parse, concurrency) =>
  walk(dir, parse, pLimit(concurrency || availableParallelism()));
