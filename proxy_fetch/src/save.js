import int from "@3-/int";
import { Presets, SingleBar } from "cli-progress";
import { myIps, pingProxy } from "./ping.js";

const LIMIT_MAX = 3000000,
  LIMIT_BATCH = 500,
  LIMIT_VERIFY_CONCURRENT = 100,
  existSet = async (db, u32_list) => {
    const rows = await db.unsafe(
      "SELECT ipv4 FROM proxy WHERE ipv4 IN(" + u32_list.map(() => "?").join(",") + ")",
      u32_list,
    );
    return new Set(rows.map(({ ipv4 }) => ipv4));
  },
  verifyBatch = async (batch, my_ips) => {
    const results = await Promise.allSettled(
      batch.map(async ([u32, kind, port]) => {
        const [is_ok] = await pingProxy(kind, u32, port, my_ips, 5000);
        return [u32, kind, port, is_ok];
      }),
    );
    return results
      .filter((res) => res.status === "fulfilled" && res.value[3])
      .map((res) => res.value.slice(0, 3));
  },
  verifyAll = async (to_verify, my_ips) => {
    const verified = [],
      is_tty = process.stdout.isTTY,
      bar = is_tty
        ? new SingleBar(
            {
              format: "验证代理 | {bar} | {percentage}% | {value}/{total} | 成功: {success}",
              barCompleteChar: "\u2588",
              barIncompleteChar: "\u2591",
              hideCursor: true,
            },
            Presets.shades_classic,
          )
        : null;

    if (bar) {
      bar.start(to_verify.length, 0, { success: 0 });
    }

    let success_count = 0;
    for (let i = 0; i < to_verify.length; i += LIMIT_VERIFY_CONCURRENT) {
      const batch = to_verify.slice(i, i + LIMIT_VERIFY_CONCURRENT),
        batch_verified = await verifyBatch(batch, my_ips);

      verified.push(...batch_verified);
      success_count += batch_verified.length;
      if (bar) {
        bar.increment(batch.length, { success: success_count });
      }
    }

    if (bar) {
      bar.stop();
    }
    return verified;
  },
  insert = async (db, verified) => {
    if (verified.length === 0) {
      return;
    }
    for (let i = 0; i < verified.length; i += LIMIT_BATCH) {
      const chunk = verified.slice(i, i + LIMIT_BATCH),
        args_insert = [],
        new_li = [];
      for (const [u32, kind, port] of chunk) {
        args_insert.push(u32, port, kind);
        new_li.push("(?,?,?)");
      }
      await db.unsafe("INSERT INTO proxy(ipv4,port,kind)VALUES" + new_li.join(","), args_insert);
    }
  };

/*
保存代理数据至数据库
ip_li: [[u32, [kind, port]], ...]
*/
export default async (db, ip_li) => {
  const my_ips = await myIps(),
    to_verify = [];

  for (let i = 0; i < ip_li.length; i += LIMIT_BATCH) {
    const chunk = ip_li.slice(i, i + LIMIT_BATCH),
      u32_list = chunk.map(([u32]) => u32),
      exists = await existSet(db, u32_list);

    for (const [u32, [kind, port]] of chunk) {
      if (!exists.has(u32)) {
        to_verify.push([u32, kind, port]);
      }
    }
  }

  let verified_len = 0;
  if (to_verify.length > 0) {
    const verified = await verifyAll(to_verify, my_ips);
    verified_len = verified.length;
    await insert(db, verified);
  }

  const failed_len = to_verify.length - verified_len;
  console.log("有效代理: " + verified_len + " | 失效代理: " + failed_len);

  const [{ count }] = await db.unsafe("SELECT COUNT(1) AS count FROM proxy"),
    over = int(count) - LIMIT_MAX;
  if (over > 0) {
    await db.unsafe("DELETE FROM proxy ORDER BY `rank` ASC LIMIT ?", [over]);
  }
};
