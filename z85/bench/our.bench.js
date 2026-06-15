#!/usr/bin/env bun
import z85e from "../src/z85e.js";
import z85d from "../src/z85d.js";

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
  const { run: run_mitata, bench, group } = await import("mitata");
  for (const [name, data] of (await import("./data.js")).default) {
    group(name, () => {
      bench("our", run(data));
    });
  }
  const res = await run_mitata({ format: "quiet" }),
    formatTable = (await import("./table.js")).default;
  console.log("\n" + formatTable(res));
}
