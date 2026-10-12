#!/usr/bin/env bun

import { SQL } from "bun";
import ipFetch from "./ipFetch.js";
import save from "./save.js";

export default async (url) => {
  const u = new URL(url);
  u.searchParams.delete("ssl");
  u.searchParams.set("sslmode", "require");
  await save(new SQL(u.href), await ipFetch());
};
