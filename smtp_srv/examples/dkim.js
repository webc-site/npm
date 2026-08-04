#!/usr/bin/env bun

import { withR } from "./lib/R.js";
import dkim from "./lib/dkim.js";
import domain from "./lib/argv.js";

await withR(async () => {
  const [selector, txt_record] = await dkim(domain);
  console.log(
    "\n请配置域名的 DKIM DNS 记录：\n\n" +
      "域名 (主机记录): " +
      selector +
      "._domainkey\n" +
      "记录类型: TXT\n" +
      "记录值: " +
      txt_record
  );
});
