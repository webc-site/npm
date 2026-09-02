#!/usr/bin/env bun

import redis, { withR } from "./lib/R.js";
import { read } from "./lib/buf.js";

const DOMAIN_PREFIX = "smtpDomainHost:",
  USER_PREFIX = "smtpUser:",
  scanKeys = async (match) => {
    let cursor = "0";
    const keys = [];
    do {
      const [next_cursor, res] = await redis.scan(cursor, "MATCH", match, "COUNT", 500);
      cursor = next_cursor;
      keys.push(...res);
    } while (cursor !== "0");
    return keys;
  };

await withR(async () => {
  const [domain_keys, user_keys] = await Promise.all([
      scanKeys(DOMAIN_PREFIX + "*"),
      scanKeys(USER_PREFIX + "*")
    ]),
    domain_map = new Map(),
    domain_bufs = domain_keys.length > 0 ? await redis.mgetBuffer(domain_keys) : [];

  domain_keys.forEach((key, idx) => {
    const domain = key.slice(DOMAIN_PREFIX.length),
      host_id = read(domain_bufs[idx]);
    domain_map.set(domain, { host_id, users: [] });
  });

  for (const key of user_keys) {
    const raw = key.slice(USER_PREFIX.length),
      pos = raw.lastIndexOf(":");
    if (pos > 0) {
      const domain = raw.slice(0, pos),
        prefix = raw.slice(pos + 1),
        email = prefix + "@" + domain;
      let item = domain_map.get(domain);
      if (!item) {
        item = { host_id: null, users: [] };
        domain_map.set(domain, item);
      }
      item.users.push(email);
    }
  }

  if (domain_map.size === 0) {
    console.log("未找到任何域名或用户数据");
    return;
  }

  for (const [domain, { host_id, users }] of domain_map) {
    console.log(`domain: ${domain}`);
    console.log(`  host_id: ${host_id !== null ? host_id : ""}`);
    if (users.length > 0) {
      console.log("  user:");
      for (const u of users) {
        console.log(`    - ${u}`);
      }
    }
  }
});
