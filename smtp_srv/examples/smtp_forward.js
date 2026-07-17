#!/usr/bin/env bun

import { withR } from "./lib/R.js";

const args = process.argv.slice(2),
  email = args[0]?.trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("用法: smtp_forward.js <源邮箱> [目标邮箱 | - (删除)]");
  process.exit(1);
}

const [user, domain] = email.split("@"),
  target = args[1]?.trim().toLowerCase(),
  key = "mailForward:" + domain;

await withR(async (redis) => {
  if (target === "-") {
    await redis.hdel(key, user);
    console.log(`已成功删除 ${email} 的转发规则`);
  } else if (target) {
    await redis.hset(key, user, target);
    console.log(`已设置转发: ${email} -> ${target}`);
  } else {
    const val = await redis.hget(key, user),
      wild = await redis.hget(key, "*"),
      NONE = "(未设置)";
    console.log(`当前规则:
  ${email} -> ${val || NONE}
  *@${domain} -> ${wild || NONE}`);
  }
});
