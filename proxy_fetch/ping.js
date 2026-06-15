#!/usr/bin/env bun

import { get } from "node:http";
import { join } from "node:path";
import { SQL } from "bun";
import { Presets, SingleBar } from "cli-progress";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import u32ToIp from "@1-/ipv4/u32_ipv4.js";
import tidb from "../../conf/TIDB.serverless.js";
import dump from "./src/dump.js";

const BASE_RANK = 10000n,
  LIMIT_BATCH = 100,
  TIMEOUT_MS = 9000,
  IP_REG = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
  HTTP = 2,
  KIND_TO_NAME = ["socks5", "socks4", "http"],
  DB = new SQL(tidb("webc") + "?sslmode=require"),
  ping = (agent) => {
    return new Promise((resolve) => {
      const start = Date.now(),
        req = get(
          "http://ip-api.com/json?lang=zh-CN",
          {
            agent,
            timeout: TIMEOUT_MS,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
          },
          (res) => {
            if (res.statusCode !== 200) {
              resolve([false, "状态码 " + res.statusCode, 0, ""]);
              return;
            }
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              try {
                const { status, query, country, regionName, city } = JSON.parse(data),
                  latency = Date.now() - start;
                if (status === "success" && IP_REG.test(query)) {
                  resolve([true, query, latency, country + " " + regionName + " " + city]);
                } else {
                  resolve([false, "接口返回失败", 0, ""]);
                }
              } catch {
                resolve([false, "解析 JSON 失败", 0, ""]);
              }
            });
          },
        );

      req.on("error", (err) => {
        resolve([false, err.message, 0, ""]);
      });

      req.on("timeout", () => {
        req.destroy();
        resolve([false, "超时", 0, ""]);
      });
    });
  },
  rank = (ok, fail) => {
    const ok_big = BigInt(ok),
      fail_big = BigInt(fail);
    return ((ok_big * 2n + 1n) * BASE_RANK) / (fail_big + 1n);
  },
  run = async () => {
    const [ip, geo] = await new Promise((resolve) => {
      const req = get("http://ip-api.com/json?lang=zh-CN", { timeout: TIMEOUT_MS }, (res) => {
        if (res.statusCode !== 200) {
          resolve(["", ""]);
          return;
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const { query, country, regionName, city } = JSON.parse(data);
            resolve([query, country + " " + regionName + " " + city]);
          } catch {
            resolve(["", ""]);
          }
        });
      });
      req.on("error", () => resolve(["", ""]));
      req.on("timeout", () => {
        req.destroy();
        resolve(["", ""]);
      });
    });
    console.log("当前本地出口 IP: " + ip + " (" + geo + ")");

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
            const ip_str = u32ToIp(ipv4),
              scheme = KIND_TO_NAME[kind],
              url = scheme + "://" + ip_str + ":" + port,
              agent = kind === HTTP ? new HttpProxyAgent(url) : new SocksProxyAgent(url),
              [is_ok, exit_ip, latency, geo] = await ping(agent),
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
        logs = [];

      for (const { status, value } of results) {
        if (status === "fulfilled") {
          const [
            _id,
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
        } else {
          fail += 1;
        }
      }

      if (logs.length > 0) {
        console.log("本批次成功代理:");
        for (const log of logs) {
          console.log(log);
        }
      }

      const placeholders = updates.map(() => "(?,?,?,?,?,?,?)").join(","),
        values = updates.flat();

      await DB.unsafe(
        "INSERT INTO proxy (id, ipv4, port, kind, oked, failed, `rank`) VALUES " +
          placeholders +
          " ON DUPLICATE KEY UPDATE oked=VALUES(oked), failed=VALUES(failed), `rank`=VALUES(`rank`)",
        values,
      );

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
