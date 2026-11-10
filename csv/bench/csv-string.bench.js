#!/usr/bin/env bun
import CSV from "csv-string";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  return () => {
    const csv = CSV.stringify([data]);
    void CSV.parse(csv)[0];
  };
};

export default run;
export const PKG = "csv-string";

if (import.meta.main) {
  await runBench(PKG, run, import.meta.dirname + "/data.js");
}
