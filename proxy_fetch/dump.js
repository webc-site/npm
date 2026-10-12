#!/usr/bin/env bun

import { SQL } from "bun";
import { join } from "node:path";
import tidb from "../../conf/TIDB.js";
import dump from "./src/dump.js";

const u = new URL(tidb("webc"));
u.searchParams.delete("ssl");
u.searchParams.set("sslmode", "require");
const DB = new SQL(u.href),
  sql_path = join(import.meta.dirname, "tidb.sql");

await dump(DB, sql_path);
