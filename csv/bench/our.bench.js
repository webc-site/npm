#!/usr/bin/env bun
import csvD from "../src/csvD.js";
import csvE from "../src/csvE.js";

const run = (data) => {
  return () => {
    const csv = csvE(data);
    csvD(csv);
  };
};

export default run;
export const PKG = "our";

if (import.meta.main) {
  const { run: mitataRun, bench, group } = await import("mitata");
  for (const [name, data] of (await import("./data.js")).default) {
    group(name, () => {
      bench(PKG, run(data));
    });
  }
  mitataRun();
}
