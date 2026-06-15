#!/usr/bin/env bun

import { connect } from "@tidbcloud/serverless";
import { join } from "node:path";
import tidb from "../../conf/TIDB.serverless.js";
import dump from "./src/dump.js";

const db = connect({ url: tidb("webc"), arrayMode: true }),
  sql_path = join(import.meta.dirname, "tidb.sql");

await dump(db, sql_path);
