#!/usr/bin/env bun
import { readdir } from "fs/promises";
import { join } from "path";
import { run, bench, group } from "mitata";
import data_list from "./data.js";

const ROOT = import.meta.dirname,
  files = await readdir(ROOT),
  ext = ".bench.js",
  bench_files = files.filter((f) => f.endsWith(ext)),
  suites = {};

for (const file of bench_files) {
  const lib_name = file.slice(0, -9),
    module = await import(join(ROOT, file));
  suites[lib_name] = module.default;
}

for (const [group_name, test_data] of data_list) {
  group(group_name, () => {
    for (const [lib_name, lib_run] of Object.entries(suites)) {
      bench(lib_name, lib_run(test_data));
    }
  });
}

const res = await run({ format: "quiet" }),
  formatTable = (await import("./table.js")).default;
console.log("\n" + formatTable(res));
