#!/usr/bin/env bun

import ERR from "@3-/log/ERR.js";
import read from "@3-/read";
import write from "@3-/write";
import yargs from "yargs";
import rule from "./js/rule.js";

const main = async () => {
  const files = yargs(process.argv.slice(2)).parse()._;
  if (files.length === 0) {
    process.exit(0);
  }

  for (const file of files) {
    if (file.endsWith(".js")) {
      try {
        const original = read(file);
        if (original) {
          const modified = await rule(original, file);
          if (modified) {
            write(file, modified);
          }
        }
      } catch (e) {
        ERR("Error processing " + file + ": " + e.message);
        process.exit(1);
      }
    }
  }
};

if (import.meta.main) {
  await main();
}
