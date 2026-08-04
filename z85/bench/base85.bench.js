#!/usr/bin/env bun
import base85 from "base85";

import runBench from "@1-/bench/run.js";

const run = (data) => {
  if (data.type === "encode") {
    const buf = Buffer.from(data.bytes);
    return () => {
      base85.encode(buf, "z85");
    };
  }
  const str = new TextDecoder().decode(data.bytes);
  return () => {
    base85.decode(str, "z85");
  };
};

export default run;

if (import.meta.main) {
  await runBench("base85", run, import.meta.dirname + "/data.js", {
    quiet: true,
    formatTable: (await import("./table.js")).default
  });
}
