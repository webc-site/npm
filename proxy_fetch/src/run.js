#!/usr/bin/env bun

import { SQL } from "bun";
import ipFetch from "./ipFetch.js";
import save from "./save.js";

export default async (url) => {
  await save(new SQL(url + (url.includes("?") ? "&" : "?") + "sslmode=require"), await ipFetch());
};
