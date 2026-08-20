import { $ as $E, uint32 } from "@1-/proto/E.js";
import { $ as $D, dUint32 } from "@1-/proto/D.js";
import utf8d from "@3-/utf8/utf8d.js";
import utf8e from "@3-/utf8/utf8e.js";
import { CAPTCHA, ERR, OK } from "./STATUS.js";

let TIMER,
  API_URL,
  CAPTCHA_TOKEN,
  ON_CAPTCHA,
  ON_ERR,
  FETCH = fetch,
  ID = 0;

const MAP = new Map(),
  REQ_LI = [],
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
  callBin = (field, bin) => concat([uint32((field << 3) | 2), uint32(bin.length), bin]),
  reqChunk = (mod_bin, id, bin) => concat([mod_bin, uint32(id), uint32(bin.length), bin]),
  resIter = function* (buf) {
    const len = buf.length;
    let pos = 0;
    while (pos < len) {
      const [id, p1] = dUint32(buf, pos),
        [status, p2] = dUint32(buf, p1);
      if (status > ERR) {
        pos = p2;
        yield [id, status];
      } else {
        const [data_len, p3] = dUint32(buf, p2);
        pos = p3 + data_len;
        yield [id, status, buf.subarray(p3, pos)];
      }
    }
  },
  fail = (id_li, err) => {
    if (id_li) {
      for (const id of id_li) {
        const item = MAP.get(id);
        if (item) {
          MAP.delete(id);
          item[1](err);
        }
      }
    }
    if (ON_ERR) ON_ERR(err);
  },
  post = async (body, id_li) => {
    const headers = {};
    if (CAPTCHA_TOKEN) headers.pragma = CAPTCHA_TOKEN;
    let res;
    try {
      res = await FETCH(API_URL, {
        method: "POST",
        headers,
        body,
        credentials: "include"
      });
    } catch (err) {
      return fail(id_li, err);
    }

    if (!res.ok) return fail(id_li, res.status);

    for (const [id, status, data_bin] of resIter(new Uint8Array(await res.arrayBuffer()))) {
      const item = MAP.get(id);
      if (!item) continue;
      const [resolve, reject, decode, chunk] = item;
      if (status === CAPTCHA) {
        (async () => {
          CAPTCHA_TOKEN = await ON_CAPTCHA();
          if (CAPTCHA_TOKEN) {
            post(chunk, [id]);
          } else {
            MAP.delete(id);
            reject();
          }
        })();
        continue;
      }
      MAP.delete(id);
      if (status === OK) {
        resolve(decode(data_bin));
      } else {
        const err = utf8d(data_bin);
        if (ON_ERR) ON_ERR(err);
        reject(err);
      }
    }
  },
  send = () => {
    TIMER = 0;
    const req_li = REQ_LI.splice(0),
      id_li = req_li.map((item) => item[0]),
      chunk_li = req_li.map((item) => item[1]);
    post(concat(chunk_li), id_li);
  },
  /*
  发送单个请求
  参数: 模块名二进制, 字段号, 编码器列表, 解码器列表, 动态参数
  返回: Promise
  */
  sendReq = (mod_bin, field, encode_li, decode_li, ...args) =>
    new Promise((resolve, reject) => {
      if (ID > 1e9) ID = 0;
      const id = ++ID,
        chunk = reqChunk(mod_bin, id, callBin(field, $E(encode_li)(args)));
      MAP.set(id, [resolve, reject, $D(decode_li), chunk]);
      REQ_LI.push([id, chunk]);
      if (!TIMER) TIMER = setTimeout(send, 1);
    });

export const setApi = (url) => (API_URL = url),
  setFetch = (func) => (FETCH = func),
  setCaptcha = (token) => (CAPTCHA_TOKEN = token),
  setOnCaptcha = (func) => (ON_CAPTCHA = func),
  setOnErr = (func) => (ON_ERR = func),
  req = (mod) => sendReq.bind(null, utf8e(mod + "\0"));
