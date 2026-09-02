#!/usr/bin/env bun
import { readdirSync } from "fs";
import { join } from "path";
import { run as mitataRun, bench, group } from "mitata";

const dir = import.meta.dirname,
  files = readdirSync(dir).filter((f) => f.endsWith(".bench.js")),
  modules = [];
for (const file of files) {
  const mod = await import(join(dir, file));
  modules.push(mod);
}

const dataList = (await import(join(dir, "data.js"))).default,
  csvE = (await import(join(dir, "../src/csvE.js"))).default;

for (const [name, data] of dataList) {
  const bytes = Buffer.byteLength(csvE(data)),
    sizeStr = bytes > 1024 ? (bytes / 1024).toFixed(1) + " KB" : bytes + " B";
  group(`${name} (${sizeStr})`, () => {
    for (const mod of modules) {
      bench(mod.PKG, mod.default(data));
    }
  });
}

const r = await mitataRun();

console.log("\n=================== 吞吐量对比 (Throughput MB/s) ===================");
const results = {};
for (const b of r.benchmarks) {
  const groupName = b.group != null && r.layout[b.group] ? r.layout[b.group].name : null;
  if (!groupName || typeof groupName !== "string") continue;
  if (!results[groupName]) results[groupName] = {};

  const match = groupName.match(/\(([\d.]+)\s*([KB|B]+)\)/);
  let bytes = 0;
  if (match) {
    const val = parseFloat(match[1]),
      unit = match[2];
    bytes = unit === "KB" ? val * 1024 : val;
  }

  const avg_ns = b.runs[0].stats.avg,
    avg_s = avg_ns / 1e9,
    mb_s = bytes / avg_s / (1024 * 1024);

  results[groupName][b.runs[0].name] = parseFloat(mb_s.toFixed(2));
}
console.table(results);
