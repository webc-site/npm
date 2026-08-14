#!/usr/bin/env node

const main = async () => {
  await import("@1-/tran/cli.js");
};

export default main;

if (import.meta.main) {
  await main();
}
