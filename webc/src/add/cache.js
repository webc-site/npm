import { existsSync } from "node:fs";
import dump from "@1-/csv/dump.js";
import load from "@1-/csv/load.js";

export const cacheLoad = async (csv_path) => {
    const rows = existsSync(csv_path) ? await load(csv_path).catch(() => []) : [];
    return new Map(rows.map(([rel, ...rest]) => [rel, rest]));
  },
  cacheDump = async (csv_path, cache_map) => {
    const rows = Array.from(cache_map, ([rel, rest]) => [rel, ...rest]).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    await dump(csv_path, rows);
  };
