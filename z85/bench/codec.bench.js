#!/usr/bin/env bun
import * as codec from "z85-codec";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  if (data.type === "encode") {
    return () => {
      codec.encode(data.bytes);
    };
  }
  const str = new TextDecoder().decode(data.bytes);
  return () => {
    codec.decode(str);
  };
};

export default run;

if (import.meta.main) {
  await runBench("codec", run, import.meta.dirname + "/data.js", {
    quiet: true,
    formatTable: (await import("./table.js")).default
  });
}
