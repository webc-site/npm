#!/usr/bin/env -S bun test

import { env } from "node:process";
import { test, expect } from "bun:test";
import net from "node:net";
import srv from "../src/srv.js";

test("srv returns URL string for active port", async () => {
  const test_port = 39220;
  env.OPENCODE_PORT = test_port;
  const server = new net.Server();
  await new Promise((resolve) => server.listen(test_port, "127.0.0.1", resolve));
  const url = await srv();
  expect(url).toBe("http://127.0.0.1:" + test_port);
  await new Promise((resolve) => server.close(resolve));
  delete env.OPENCODE_PORT;
});
