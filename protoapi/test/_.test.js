#!/usr/bin/env -S bun test

import sleep from "@3-/sleep";
import { expect, test } from "bun:test";
import { dUint32 } from "@1-/proto/D.js";
import { string } from "@1-/proto/E.js";
import { uint64 } from "@1-/proto/D.js";
import utf8e from "@3-/utf8/utf8e.js";
import { req, setApi, setCaptcha, setFetch, setOnCaptcha, setOnErr } from "../src/_.js";
import { CAPTCHA, ERR, OK } from "../src/STATUS.js";

setApi("http://localhost:9999");

const reqId = (body) => dUint32(body, body.indexOf(0) + 1)[0],
  mockRes = (arr, status = 200) => new Response(new Uint8Array(arr), { status }),
  mockFetch = (fn) => setFetch(async (_, conf) => mockRes(fn(reqId(conf.body), conf))),
  setRes = (status, data = []) =>
    mockFetch((id) => [id, status, ...(status <= ERR ? [data.length, ...data] : data)]),
  call = req("auth").bind(null, 1, [string], [uint64], "test@mail.com");

test("成功", async () => {
  setRes(OK);
  expect(await call()).toEqual([0]);
});

test("错误", async () => {
  let err_msg;
  setOnErr((err) => {
    err_msg = err;
  });
  setRes(ERR, utf8e("fail"));
  expect(call()).rejects.toBe("fail");
  await sleep();
  expect(err_msg).toBe("fail");
});

test("网络异常", async () => {
  setFetch(async () => {
    throw new Error("net error");
  });
  expect(call()).rejects.toThrow("net error");
});

test("HTTP 错误状态码", async () => {
  setFetch(async () => new Response("Bad Gateway", { status: 502 }));
  expect(call()).rejects.toBe("HTTP 502");
});

test("验证码重试", async () => {
  let count = 0,
    pragma = "";
  setOnCaptcha(async () => "test_token");
  mockFetch((id, conf) => {
    if (++count === 1) return [id, CAPTCHA];
    pragma = conf?.headers?.pragma;
    return [id, OK, 0];
  });
  expect(await call()).toEqual([0]);
  expect(pragma).toBe("test_token");
});

test("验证码拒绝", async () => {
  setOnCaptcha(async () => "");
  setRes(CAPTCHA);
  expect(call()).rejects.toBeUndefined();
});

test("设置验证码", async () => {
  let pragma = "";
  setCaptcha("direct_token");
  mockFetch((id, conf) => {
    pragma = conf?.headers?.pragma;
    return [id, OK, 0];
  });
  expect(await call()).toEqual([0]);
  expect(pragma).toBe("direct_token");
  setCaptcha("");
});

test("批量请求", async () => {
  setFetch(async (_, conf) => {
    const buf = conf.body,
      res_li = [];
    let pos = 0;
    while (pos < buf.length) {
      const p1 = buf.indexOf(0, pos) + 1,
        [id, p2] = dUint32(buf, p1),
        [len, p3] = dUint32(buf, p2);
      res_li.push(id, OK, 0);
      pos = p3 + len;
    }
    return mockRes(res_li);
  });
  const res_li = await Promise.all([call(), call()]);
  res_li.forEach((res) => expect(res).toEqual([0]));
});
