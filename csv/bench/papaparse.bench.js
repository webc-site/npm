#!/usr/bin/env bun
import Papa from "papaparse";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  return () => {
    const csv = Papa.unparse([data]);
    void Papa.parse(csv).data[0];
  };
};

export default run;
export const PKG = "papaparse";

if (import.meta.main) {
  await runBench(PKG, run, import.meta.dirname + "/data.js");
}
