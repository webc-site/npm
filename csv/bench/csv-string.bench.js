#!/usr/bin/env bun
import CSV from "csv-string";

const run = (data) => {
  return () => {
    const csv = CSV.stringify([data]);
    void CSV.parse(csv)[0];
  };
};

export default run;
export const PKG = "csv-string";

if (import.meta.main) {
  const { run: mitataRun, bench, group } = await import("mitata");
  for (const [name, data] of (await import("./data.js")).default) {
    group(name, () => {
      bench(PKG, run(data));
    });
  }
  mitataRun();
}
