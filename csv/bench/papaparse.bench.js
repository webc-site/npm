#!/usr/bin/env bun
import Papa from "papaparse";

const run = (data) => {
  return () => {
    const csv = Papa.unparse([data]);
    void Papa.parse(csv).data[0];
  };
};

export default run;
export const PKG = "papaparse";

if (import.meta.main) {
  const { run: mitataRun, bench, group } = await import("mitata");
  for (const [name, data] of (await import("./data.js")).default) {
    group(name, () => {
      bench(PKG, run(data));
    });
  }
  mitataRun();
}
