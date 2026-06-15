#!/usr/bin/env bun

import tidb from "../../conf/TIDB.js";
import run from "./src/run.js";

await run(process.argv[2] || tidb("webc"));
process.exit(0);
