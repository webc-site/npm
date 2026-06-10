#!/usr/bin/env bun

import read from "@3-/read";
import { cd, $ } from "zx";
import { join } from "node:path";
import { readdirSync, writeFileSync } from "node:fs";
import PLATFORM_DEFAULT from "./src/PLATFORM.js";

$.verbose = 1;

const ROOT = import.meta.dirname,
  { env } = process,
  main = async (platform, args = []) => {
    cd(ROOT);

    const OUT = join("npm", platform);

    // bun x napi create-npm-dirs &&

    await $`rm -rf npm && bun x napi build --platform ${args} --output-dir ${OUT}`;

    const files = readdirSync(OUT),
      file = files.find((f) => f.includes(`.${platform}.`)),
      index = read(join(OUT, "index.js"));

    writeFileSync(
      join(OUT, "index.js"),
      "const nativeBinding = require('./" +
        file +
        "');\n" +
        index.slice(index.indexOf("\nmodule.exports =")),
    );
  };

export default main;

if (import.meta.main) {
  const args = [];
  if (env.NODE_ENV === "production") {
    args.push("--release");
  }
  await main(PLATFORM_DEFAULT, args);
}
