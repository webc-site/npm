#!/usr/bin/env bun

import { join } from "node:path";
import { SQL } from "bun";
import { Presets, SingleBar } from "cli-progress";
import u32ToIp from "@1-/ipv4/u32_ipv4.js";
import tidb from "../../conf/TIDB.js";
import dump from "./src/dump.js";
import { KIND_TO_NAME, myIps, pingProxy } from "./src/ping.js";

const BASE_RANK = 10000n,
  LIMIT_BATCH = 100,
  url = tidb("webc"),
  DB = new SQL(url + (url.includes("?") ? "&" : "?") + "sslmode=require"),
  rank = (ok, fail) => {
    const ok_big = BigInt(ok),
      fail_big = BigInt(fail);
    return Number(((ok_big * 2n + 1n) * BASE_RANK) / (fail_big + 1n));
  },
  run = async () => {
    const my_ips = await myIps(),
      [ip] = my_ips;
    console.log("当前本地出口 IP: " + (ip || "未知"));

    const [{ count }] = await DB.unsafe("SELECT COUNT(1) AS count FROM proxy"),
      total = Number(count);
    console.log("待 Ping 的代理总数: " + total);

    if (total === 0) {
      return;
    }

    const { shades_classic } = Presets,
      bar = new SingleBar(
        {
          format: "进度 | {bar} | {percentage}% | {value}/{total} | 成功: {success} | 失败: {fail}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        },
        shades_classic,
      );

    bar.start(total, 0, { success: 0, fail: 0 });

    let last_id = 0,
      success = 0,
      fail = 0;

    for (;;) {
      const rows = await DB.unsafe(
        "SELECT id, ipv4, port, kind, oked, failed FROM proxy WHERE id > ? ORDER BY id ASC LIMIT ?",
        [last_id, LIMIT_BATCH],
      );

      if (rows.length === 0) {
        break;
      }

      last_id = Number(rows[rows.length - 1].id);

      const results = await Promise.allSettled(
          rows.map(async ({ id, ipv4, port, kind, oked, failed }) => {
            const [is_ok, exit_ip, latency, geo] = await pingProxy(kind, ipv4, port, my_ips),
              new_oked = oked + (is_ok ? 1 : 0),
              new_failed = failed + (is_ok ? 0 : 1),
              new_rank = rank(new_oked, new_failed);

            return [
              id,
              ipv4,
              port,
              kind,
              new_oked,
              new_failed,
              new_rank,
              is_ok,
              exit_ip,
              latency,
              geo,
            ];
          }),
        ),
        updates = [],
        logs = [],
        to_delete = [];

      for (const { status, value } of results) {
        if (status === "fulfilled") {
          const [
            id,
            ipv4,
            port,
            kind,
            _new_oked,
            _new_failed,
            _new_rank,
            is_ok,
            exit_ip,
            latency,
            geo,
          ] = value;

          if (exit_ip === "暴露本机IP") {
            to_delete.push(id);
            logs.push("  " + u32ToIp(ipv4) + ":" + port + " -> 暴露本机 IP，执行删除！");
          } else {
            if (is_ok) {
              success += 1;
              logs.push(
                "  " +
                  u32ToIp(ipv4) +
                  ":" +
                  port +
                  " (" +
                  KIND_TO_NAME[kind] +
                  ") -> 出口: " +
                  exit_ip +
                  " (" +
                  geo +
                  ") (" +
                  latency +
                  "ms)",
              );
            } else {
              fail += 1;
            }
            updates.push(value.slice(0, 7));
          }
        } else {
          fail += 1;
        }
      }

      if (logs.length > 0) {
        console.log("本批次日志:");
        for (const log of logs) {
          console.log(log);
        }
      }

      if (to_delete.length > 0) {
        await DB.unsafe(
          "DELETE FROM proxy WHERE id IN(" + to_delete.map(() => "?").join(",") + ")",
          to_delete,
        );
      }

      if (updates.length > 0) {
        const placeholders = updates.map(() => "(?,?,?,?,?,?,?)").join(","),
          values = updates.flat();

        await DB.unsafe(
          "INSERT INTO proxy (id, ipv4, port, kind, oked, failed, `rank`) VALUES " +
            placeholders +
            " ON DUPLICATE KEY UPDATE oked=VALUES(oked), failed=VALUES(failed), `rank`=VALUES(`rank`)",
          values,
        );
      }

      bar.increment(rows.length, { success, fail });
    }

    bar.stop();
    console.log("Ping 任务结束，正在更新 tidb.sql...");

    const path = join(import.meta.dirname, "tidb.sql");
    await dump(DB, path);
    console.log("tidb.sql 更新成功。");
  };

await run();
process.exit(0);
