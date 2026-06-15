#!/usr/bin/env bun
import base85 from "base85";

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
  const { run: run_mitata, bench, group } = await import("mitata");
  for (const [name, data] of (await import("./data.js")).default) {
    group(name, () => {
      bench("base85", run(data));
    });
  }
  const res = await run_mitata({ format: "quiet" }),
    formatTable = (await import("./table.js")).default;
  console.log("\n" + formatTable(res));
}
