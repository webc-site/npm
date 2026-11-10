#!/usr/bin/env bun
import csvD from "../src/csvD.js";
import csvE from "../src/csvE.js";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  return () => {
    const csv = csvE(data);
    csvD(csv);
  };
};

export default run;
export const PKG = "our";

if (import.meta.main) {
  await runBench(PKG, run, import.meta.dirname + "/data.js");
}
