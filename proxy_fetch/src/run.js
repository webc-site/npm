#!/usr/bin/env bun

import { SQL } from "bun";
import ipFetch from "./ipFetch.js";
import save from "./save.js";

export default async (url) => {
  const db = new SQL(url + "?sslmode=require");
  await save(db, await ipFetch());
};
