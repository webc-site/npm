#!/usr/bin/env -S bun test

import { expect, test } from "bun:test";
import { string } from "@1-/proto/E.js";
import { uint64 } from "@1-/proto/D.js";
import { req, setApi, setFetch } from "../src/_.js";

test("req basic", async () => {
  setApi("http://localhost:9999");
  setFetch(async () => {
    return new Response(new Uint8Array([1, 0, 0]));
  });

  const authReq = req("auth"),
    p = authReq(1, [string], [uint64], "test@mail.com");

  expect(p instanceof Promise).toBe(true);
});
