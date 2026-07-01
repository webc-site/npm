#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import one from "../src/one.js";
import sentinel from "../src/sentinel.js";
import cluster from "../src/cluster.js";
import redis, { env } from "../src/_.js";
import nodeSplit from "../src/nodeSplit.js";

[
  ["单点", () => one("127.0.0.1", 6379)],
  ["哨兵", () => sentinel(nodeSplit("127.0.0.1:26379 127.0.0.1:26380"), "mymaster")],
  ["集群", () => cluster(nodeSplit("127.0.0.1:30001 127.0.0.1:30002"))],
  ["env 文件", () => redis("../conf/rust/kvrocks.env")],
  ["env 对象", () => env({ R_NODE: "127.0.0.1:6379" })],
].forEach(([name, connect]) => {
  test(name, () => {
    const r = connect();
    expect(r[Symbol.dispose]).toBeFunction();
    expect(r[Symbol.asyncDispose]).toBeFunction();
    r.disconnect();
  });
});
