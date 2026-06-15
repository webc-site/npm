#!/usr/bin/env bun

import { SQL } from "bun";
import { join } from "node:path";
import tidb from "../../conf/TIDB.serverless.js";
import dump from "./src/dump.js";

const db = new SQL(tidb("webc") + "?sslmode=require"),
  sql_path = join(import.meta.dirname, "tidb.sql");

await dump(db, sql_path);
