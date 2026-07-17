import read from "@1-/read";
import { expect, test, mock } from "bun:test";
import { join } from "node:path";
import { SQL } from "bun";
import { unlink } from "node:fs/promises";
import ipToU32 from "@1-/ipv4/ipv4_u32.js";
import tidb from "../../conf/TIDB.js";
import dump from "../src/dump.js";

mock.module("../src/ping.js", () => {
  return {
    HTTP: 2,
    KIND_TO_NAME: ["socks5", "socks4", "http"],
    agentByProxy: () => null,
    myIps: async () => new Set(["127.0.0.1"]),
    ping: async () => [true, "1.2.3.4", 10, "US"],
    pingProxy: async () => [true, "1.2.3.4", 10, "US"],
    request: async (url) => {
      if (url.includes("pubproxy.com")) {
        if (mock_pubproxy_err) {
          return [false, mock_pubproxy_err?.status === 503 ? "状态码 503" : "错误"];
        }
        let data = mock_pubproxies;
        if (Array.isArray(data) && Array.isArray(data[0])) {
          data = mock_pubproxies.shift();
        } else {
          mock_pubproxies = [];
        }
        return [true, JSON.stringify({ data, count: data ? data.length : 0 })];
      }
      return [false, ""];
    }
  };
});

let mock_proxies = [],
  mock_pubproxies = [],
  mock_pubproxy_err = null;
mock.module("@3-/req/reqJson.js", () => {
  return {
    default: async (url) => {
      if (url.includes("proxyscrape.com")) {
        return {
          proxies: mock_proxies,
          shown_records: mock_proxies.length,
          nextpage: false
        };
      }
      if (url.includes("pubproxy.com")) {
        if (mock_pubproxy_err) {
          throw mock_pubproxy_err;
        }
        const data = mock_pubproxies;
        mock_pubproxies = [];
        return {
          data,
          count: data ? data.length : 0
        };
      }

      return {};
    }
  };
});

import save from "../src/save.js";
import ipFetch from "../src/ipFetch.js";
import pubproxy from "../src/api/pubproxy.js";

const url = tidb("webc"),
  db = new SQL(url + (url.includes("?") ? "&" : "?") + "sslmode=require");

test("导出表结构", async () => {
  const sql_path = join(import.meta.dirname, "test.sql");
  try {
    await dump(db, sql_path);
    expect(await read(sql_path)).toContain("CREATE TABLE `proxy`");
  } finally {
    try {
      await unlink(sql_path);
    } catch {}
  }
}, 20000);

test("保存逻辑", async () => {
  const test_ip = 2130706433,
    rm = () => db.unsafe("DELETE FROM proxy WHERE ipv4 = ?", [test_ip]);
  try {
    await rm();
    const check = async (item) => {
      await save(db, [[test_ip, item]]);
      const [{ count }] = await db.unsafe("SELECT COUNT(1) AS count FROM proxy WHERE ipv4 = ?", [
        test_ip
      ]);
      expect(Number(count)).toBe(1);
    };

    for (const item of [
      [0, 80],
      [1, 8080]
    ]) {
      await check(item);
    }
  } finally {
    await rm();
  }
}, 20000);

test("ipFetch 去重逻辑", async () => {
  const ip = ipToU32("1.1.1.1");
  mock_pubproxies = [];
  mock_pubproxy_err = null;

  for (const [proxies, expected] of [
    [
      ["socks5://1.1.1.1:1080", "socks4://1.1.1.1:1081"],
      [0, 1080]
    ],
    [
      ["socks4://1.1.1.1:1081", "socks5://1.1.1.1:1080"],
      [0, 1080]
    ],
    [
      ["socks5://1.1.1.1:1080", "http://1.1.1.1:80"],
      [0, 1080]
    ],
    [
      ["http://1.1.1.1:80", "socks5://1.1.1.1:1080"],
      [0, 1080]
    ]
  ]) {
    mock_proxies = proxies.map((proxy) => ({ proxy, anonymity: "elite" }));
    expect(await ipFetch()).toEqual([[ip, expected]]);
  }
});

test("ipFetch 并发与去重 (proxyscrape + pubproxy)", async () => {
  const ip1 = ipToU32("1.1.1.1"),
    ip2 = ipToU32("2.2.2.2");

  mock_proxies = [{ proxy: "socks5://1.1.1.1:1080", anonymity: "elite" }];
  mock_pubproxies = [{ ip: "2.2.2.2", type: "http", port: "80" }];
  mock_pubproxy_err = null;

  const res = await ipFetch();
  expect(res).toEqual([
    [ip1, [0, 1080]],
    [ip2, [2, 80]]
  ]);
});

test("ipFetch 遇到 503 错误时 break", async () => {
  mock_proxies = [];
  mock_pubproxies = [{ ip: "2.2.2.2", type: "http", port: "80" }];
  mock_pubproxy_err = { status: 503 };

  const res = await ipFetch();
  // 因为 503 抛出错误被捕获，应当直接 break 并返回已获取的内容，此时 mock_pubproxies 已被消费掉
  expect(res).toEqual([]);
});

test("pubproxy 递归与去重", async () => {
  mock_pubproxy_err = null;
  mock_pubproxies = [
    [{ ip: "2.2.2.2", type: "http", port: 80 }],
    [{ ip: "3.3.3.3", type: "http", port: 80 }],
    [{ ip: "1.1.1.1", type: "http", port: 80 }]
  ];

  const res = await pubproxy(["1.1.1.1", "http", 80]);
  expect(res).toEqual([
    ["2.2.2.2", "http", 80],
    ["3.3.3.3", "http", 80]
  ]);
});
