#!/usr/bin/env bun

import { SQL } from "bun";
import { join } from "node:path";
import tidb from "../../conf/TIDB.js";
import dump from "./src/dump.js";

const DB = new SQL(tidb("webc")),
  sql_path = join(import.meta.dirname, "tidb.sql");

await dump(DB, sql_path);
