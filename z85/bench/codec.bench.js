#!/usr/bin/env bun
import * as codec from "z85-codec";

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
  const { run: run_mitata, bench, group } = await import("mitata");
  for (const [name, data] of (await import("./data.js")).default) {
    group(name, () => {
      bench("codec", run(data));
    });
  }
  const res = await run_mitata({ format: "quiet" }),
    formatTable = (await import("./table.js")).default;
  console.log("\n" + formatTable(res));
}
