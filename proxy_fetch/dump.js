#!/usr/bin/env bun

import { SQL } from "bun";
import { join } from "node:path";
import tidb from "../../conf/TIDB.js";
import dump from "./src/dump.js";

const url = tidb("webc"),
  DB = new SQL(url + (url.includes("?") ? "&" : "?") + "sslmode=require"),
  sql_path = join(import.meta.dirname, "tidb.sql");

await dump(DB, sql_path);
