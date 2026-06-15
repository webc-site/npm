import read from "@1-/read";
import { expect, test, mock } from "bun:test";
import { join } from "node:path";
import { SQL } from "bun";
import { unlink } from "node:fs/promises";
import ipToU32 from "@1-/ipv4/ipv4_u32.js";
import tidb from "../../conf/TIDB.js";
import dump from "../src/dump.js";
import save from "../src/save.js";

let mock_proxies = [];
mock.module("@3-/req/reqJson.js", () => {
  return {
    default: async () => {
      return {
        proxies: mock_proxies,
        shown_records: mock_proxies.length,
        nextpage: false,
      };
    },
  };
});

import ipFetch from "../src/ipFetch.js";

const url = tidb("webc"),
  DB = new SQL(url + (url.includes("?") ? "&" : "?") + "sslmode=require");

test("导出表结构", async () => {
  const sql_path = join(import.meta.dirname, "test.sql");
  try {
    await dump(DB, sql_path);
    expect(await read(sql_path)).toContain("CREATE TABLE `proxy`");
  } finally {
    try {
      await unlink(sql_path);
    } catch {}
  }
}, 20000);

test("保存逻辑", async () => {
  const test_ip = 2130706433,
    rm = () => DB.unsafe("DELETE FROM proxy WHERE ipv4 = ?", [test_ip]);
  try {
    await rm();
    const check = async (item) => {
      await save(DB, [[test_ip, item]]);
      const [{ count }] = await DB.unsafe("SELECT COUNT(1) AS count FROM proxy WHERE ipv4 = ?", [
        test_ip,
      ]);
      expect(Number(count)).toBe(1);
    };

    for (const item of [
      [0, 80],
      [1, 8080],
    ]) {
      await check(item);
    }
  } finally {
    await rm();
  }
}, 20000);

test("ipFetch 去重逻辑", async () => {
  const ip = ipToU32("1.1.1.1");

  mock_proxies = [
    { proxy: "socks5://1.1.1.1:1080", anonymity: "elite" },
    { proxy: "socks4://1.1.1.1:1081", anonymity: "elite" },
  ];
  let res = await ipFetch();
  expect(res).toEqual([[ip, [0, 1080]]]);

  mock_proxies = [
    { proxy: "socks4://1.1.1.1:1081", anonymity: "elite" },
    { proxy: "socks5://1.1.1.1:1080", anonymity: "elite" },
  ];
  res = await ipFetch();
  expect(res).toEqual([[ip, [0, 1080]]]);

  mock_proxies = [
    { proxy: "socks5://1.1.1.1:1080", anonymity: "elite" },
    { proxy: "http://1.1.1.1:80", anonymity: "elite" },
  ];
  res = await ipFetch();
  expect(res).toEqual([[ip, [2, 80]]]);

  mock_proxies = [
    { proxy: "http://1.1.1.1:80", anonymity: "elite" },
    { proxy: "socks5://1.1.1.1:1080", anonymity: "elite" },
  ];
  res = await ipFetch();
  expect(res).toEqual([[ip, [2, 80]]]);
});
