#!/usr/bin/env bun
import z85e from "../src/z85e.js";
import z85d from "../src/z85d.js";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  if (data.type === "encode") {
    return () => {
      z85e(data.bytes);
    };
  }
  return () => {
    z85d(data.bytes);
  };
};

export default run;

if (import.meta.main) {
  await runBench("our", run, import.meta.dirname + "/data.js", {
    quiet: true,
    formatTable: (await import("./table.js")).default
  });
}
