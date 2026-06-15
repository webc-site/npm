#!/usr/bin/env bun

import { connect } from "@tidbcloud/serverless";
import ipFetch from "./ipFetch.js";
import save from "./save.js";

export default async (url) => {
  const db = connect({ url, arrayMode: true });
  await save(db, await ipFetch());
};
