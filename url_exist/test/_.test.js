#!/usr/bin/env -S bun test

import { test, expect, beforeAll, afterAll } from "bun:test";
import urlExist from "../src/_.js";

let server;
const PORT = 30123,
  BASE_URL = "http://localhost:" + PORT;

beforeAll(() => {
  server = Bun.serve({
    port: PORT,
    fetch(req) {
      const path = new URL(req.url).pathname;
      return path === "/ok"
        ? new Response("OK")
        : path === "/timeout"
          ? new Promise((resolve) => setTimeout(() => resolve(new Response("OK")), 4000))
          : new Response("Not Found", { status: 404 });
    }
  });
});

afterAll(() => server.stop());

[
  ["存在", "/ok", undefined, true],
  ["不存在", "/404", undefined, false],
  ["超时", "/timeout", 1000, false],
  ["不超时", "/timeout", 5000, true]
].forEach(([desc, path, timeout, expected]) => {
  test(desc, async () => {
    expect(!!(await urlExist(BASE_URL + path, timeout))).toBe(expected);
  });
});
