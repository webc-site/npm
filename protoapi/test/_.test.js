#!/usr/bin/env -S bun test

import { describe, expect, test } from "bun:test";
import { $ as $E, bool as eBool, int32 as eInt32, string as eString, uint32 } from "@1-/proto/E.js";
import {
  $ as $D,
  bool as dBool,
  dUint32,
  int32 as dInt32,
  string as dString
} from "@1-/proto/D.js";
import utf8d from "@3-/utf8/utf8d.js";
import utf8e from "@3-/utf8/utf8e.js";
import { CAPTCHA, ERR, OK } from "../src/STATUS.js";
import { req, setApi, setCaptcha, setFetch, setOnCaptcha, setOnErr } from "../src/_.js";

const API = "https://api.example.com/rpc",
  concat = (list) => {
    const total_len = list.reduce((len, arr) => len + arr.length, 0),
      result = new Uint8Array(total_len);
    let offset = 0;
    for (const arr of list) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  },
  okRes = (id, data_bin) => concat([uint32(id), uint32(OK), uint32(data_bin.length), data_bin]),
  errRes = (id, msg) => {
    const bin = utf8e(msg);
    return concat([uint32(id), uint32(ERR), uint32(bin.length), bin]);
  },
  captchaRes = (id) => concat([uint32(id), uint32(CAPTCHA)]),
  mockRes = (buf, init = {}) =>
    new Response(buf, {
      status: 200,
      headers: { "content-type": "application/octet-stream" },
      ...init
    }),
  parseReqChunks = (buf) => {
    const chunks = [],
      len = buf.length;
    let pos = 0;
    while (pos < len) {
      let zero_pos = pos;
      while (zero_pos < len && buf[zero_pos] !== 0) {
        ++zero_pos;
      }
      const mod = utf8d(buf.subarray(pos, zero_pos));
      pos = zero_pos + 1;
      const [id, p1] = dUint32(buf, pos),
        [bin_len, p2] = dUint32(buf, p1),
        chunk_data = buf.subarray(p2, p2 + bin_len);
      pos = p2 + bin_len;

      const [tag, t1] = dUint32(chunk_data, 0),
        field = tag >>> 3,
        [data_len, t2] = dUint32(chunk_data, t1),
        payload = chunk_data.subarray(t2, t2 + data_len);

      chunks.push({ mod, id, field, payload });
    }
    return chunks;
  };

describe("protoapi 接口测试", () => {
  test("单请求成功与请求体解析", async () => {
    setApi(API);
    let received_url, received_opt;

    setFetch(async (url, opt) => {
      received_url = url;
      received_opt = opt;
      const chunks = parseReqChunks(opt.body),
        chunk = chunks[0],
        dec = $D([dString])(chunk.payload),
        res_payload = $E([eString])(["pong: " + dec[0]]);
      return mockRes(okRes(chunk.id, res_payload));
    });

    const userReq = req("user"),
      res = await userReq(1, [eString], [dString], "ping");

    expect(received_url).toBe(API);
    expect(received_opt.method).toBe("POST");
    expect(received_opt.credentials).toBe("include");
    expect(res).toEqual(["pong: ping"]);
  });

  test("多请求自动合并批量发送", async () => {
    let call_count = 0;
    setFetch(async (url, opt) => {
      ++call_count;
      const chunks = parseReqChunks(opt.body),
        responses = chunks.map((c) => {
          const dec = $D([dInt32])(c.payload),
            res_bin = $E([eInt32])([dec[0] * 10]);
          return okRes(c.id, res_bin);
        });
      return mockRes(concat(responses));
    });

    const mathReq = req("math"),
      [r1, r2, r3] = await Promise.all([
        mathReq(1, [eInt32], [dInt32], 1),
        mathReq(2, [eInt32], [dInt32], 2),
        mathReq(3, [eInt32], [dInt32], 3)
      ]);

    expect(call_count).toBe(1);
    expect(r1).toEqual([10]);
    expect(r2).toEqual([20]);
    expect(r3).toEqual([30]);
  });

  test("业务错误返回与 setOnErr 触发", async () => {
    let err_caught;
    setOnErr((err) => (err_caught = err));

    setFetch(async (url, opt) => {
      const chunks = parseReqChunks(opt.body);
      return mockRes(errRes(chunks[0].id, "无权限访问"));
    });

    const authReq = req("auth");
    await expect(authReq(1, [eString], [dString], "token")).rejects.toBe("无权限访问");
    expect(err_caught).toBe("无权限访问");
  });

  test("HTTP 错误状态响应处理", async () => {
    let err_caught;
    setOnErr((err) => (err_caught = err));

    setFetch(async () => new Response("Server Error", { status: 500 }));

    const testReq = req("test");
    await expect(testReq(1, [eString], [dString], "a")).rejects.toBe(500);
    expect(err_caught).toBe(500);
  });

  test("网络异常 fetch 抛错处理", async () => {
    let err_caught;
    setOnErr((err) => (err_caught = err));

    setFetch(async () => {
      throw new Error("网络断开");
    });

    const testReq = req("test");
    await expect(testReq(1, [eString], [dString], "a")).rejects.toThrow("网络断开");
    expect(err_caught?.message).toBe("网络断开");
  });

  test("验证码重试流程成功", async () => {
    let step = 0;
    setOnCaptcha(async () => "new_captcha_token");

    setFetch(async (url, opt) => {
      const chunks = parseReqChunks(opt.body),
        chunk = chunks[0];
      if (step === 0) {
        ++step;
        return mockRes(captchaRes(chunk.id));
      }
      expect(opt.headers.pragma).toBe("new_captcha_token");
      const res_payload = $E([eString])(["验证通过"]);
      return mockRes(okRes(chunk.id, res_payload));
    });

    const testReq = req("secure"),
      res = await testReq(1, [eString], [dString], "data");
    expect(res).toEqual(["验证通过"]);
  });

  test("验证码取消/获取失败 reject", async () => {
    setOnCaptcha(async () => "");

    setFetch(async (url, opt) => {
      const chunks = parseReqChunks(opt.body);
      return mockRes(captchaRes(chunks[0].id));
    });

    const testReq = req("secure");
    await expect(testReq(1, [eString], [dString], "data")).rejects.toBeUndefined();
  });

  test("手动配置 setCaptcha 携带 header", async () => {
    setCaptcha("custom_token");
    let pragma_header;

    setFetch(async (url, opt) => {
      pragma_header = opt.headers.pragma;
      const chunks = parseReqChunks(opt.body),
        res_payload = $E([eString])(["ok"]);
      return mockRes(okRes(chunks[0].id, res_payload));
    });

    const testReq = req("test");
    await testReq(1, [eString], [dString], "data");
    expect(pragma_header).toBe("custom_token");
    setCaptcha("");
  });

  test("多数据类型组合编解码", async () => {
    setFetch(async (url, opt) => {
      const chunks = parseReqChunks(opt.body),
        chunk = chunks[0],
        dec = $D([dInt32, dString, dBool])(chunk.payload),
        res_payload = $E([eBool, eInt32, eString])([!dec[2], dec[0] + 100, dec[1] + "_res"]);
      return mockRes(okRes(chunk.id, res_payload));
    });

    const testReq = req("types"),
      res = await testReq(1, [eInt32, eString, eBool], [dBool, dInt32, dString], 42, "hello", true);

    expect(res).toEqual([false, 142, "hello_res"]);
  });
});
