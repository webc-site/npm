#!/usr/bin/env bun
import * as lapo from "@lapo/z85";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  if (data.type === "encode") {
    return () => {
      lapo.encode(data.bytes);
    };
  }
  const str = new TextDecoder().decode(data.bytes);
  return () => {
    lapo.decode(str);
  };
};

export default run;

if (import.meta.main) {
  await runBench("lapo", run, import.meta.dirname + "/data.js", {
    quiet: true,
    formatTable: (await import("./table.js")).default
  });
}
