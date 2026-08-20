import { $ as $E, uint32 } from "@1-/proto/E.js";
import { $ as $D, dUint32 } from "@1-/proto/D.js";
import utf8d from "@3-/utf8/utf8d.js";
import utf8e from "@3-/utf8/utf8e.js";
import { OK, ERR, CAPTCHA } from "./STATUS.js";

let TIMER,
  API_URL,
  CAPTCHA_TOKEN,
  ON_CAPTCHA,
  ON_ERR,
  FETCH = fetch,
  ID = 0;

const MAP = {},
  REQ_LI = [],
  callBin = (field, bin) => {
    const bin_len = bin.length,
      tag = uint32((field << 3) | 2),
      tag_len = tag.length,
      len = uint32(bin_len),
      p1 = tag_len + len.length,
      buf = new Uint8Array(p1 + bin_len);
    buf.set(tag, 0);
    buf.set(len, tag_len);
    buf.set(bin, p1);
    return buf;
  },
  reqChunk = (mod_bin, id, bin) => {
    const mod_len = mod_bin.length,
      bin_len = bin.length,
      h1 = uint32(id),
      h2 = uint32(bin_len),
      p1 = mod_len + h1.length,
      p2 = p1 + h2.length,
      buf = new Uint8Array(p2 + bin_len);
    buf.set(mod_bin, 0);
    buf.set(h1, mod_len);
    buf.set(h2, p1);
    buf.set(bin, p2);
    return buf;
  },
  resIter = function* (buf) {
    let pos = 0;
    const buf_len = buf.length;
    while (pos < buf_len) {
      const [id, p1] = dUint32(buf, pos),
        [status, p2] = dUint32(buf, p1);
      if (status > ERR) {
        yield [id, status];
        pos = p2;
      } else {
        const [len, p3] = dUint32(buf, p2);
        yield [id, status, buf.subarray(p3, p3 + len)];
        pos = p3 + len;
      }
    }
  },
  post = async (body) => {
    const headers = {},
      conf = {
        method: "POST",
        headers,
        body
      };
    if (CAPTCHA_TOKEN) {
      headers.pragma = CAPTCHA_TOKEN;
    }
    const res = await FETCH(API_URL, conf);
    for (const [id, status, data_bin] of resIter(new Uint8Array(await res.arrayBuffer()))) {
      const item = MAP[id];
      if (!item) continue;
      if (status === CAPTCHA) {
        (async () => {
          CAPTCHA_TOKEN = await ON_CAPTCHA();
          post(item[3]);
        })();
        continue;
      }
      delete MAP[id];
      const [resolve, reject, decode] = item;
      if (status === OK) {
        resolve(decode(data_bin));
      } else if (status === ERR) {
        const err = utf8d(data_bin);
        if (ON_ERR) ON_ERR(err);
        reject(err);
      }
    }
  },
  send = () => {
    TIMER = 0;
    const req_li = REQ_LI.splice(0),
      len = req_li.reduce((a, b) => a + b.length, 0),
      body = new Uint8Array(len);
    let pos = 0;
    for (const b of req_li) {
      body.set(b, pos);
      pos += b.length;
    }
    post(body);
  },
  sendReq = (mod_bin, field, encode_li, decode_li, args) =>
    new Promise((resolve, reject) => {
      if (ID > 1e9) ID = 0;
      const id = ++ID,
        chunk = reqChunk(mod_bin, id, callBin(field, $E(encode_li)(args)));
      MAP[id] = [resolve, reject, $D(decode_li), chunk];
      REQ_LI.push(chunk);
      if (!TIMER) TIMER = setTimeout(send, 1);
    });

export const setApi = (url) => {
    API_URL = url;
  },
  setFetch = (func) => {
    FETCH = func;
  },
  setCaptcha = (token) => {
    CAPTCHA_TOKEN = token;
  },
  setOnCaptcha = (func) => {
    ON_CAPTCHA = func;
  },
  setOnErr = (func) => {
    ON_ERR = func;
  },
  req = (mod) => {
    const mod_bin = utf8e(mod + "\0");
    return (field, encode_li, decode_li, ...args) =>
      sendReq(mod_bin, field, encode_li, decode_li, args);
  };
