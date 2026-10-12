/*
Markdown 状态机
匹配: ![alt](url)
参数: line (待解析行)
返回值: [[url_start, url_end, url], ...]
*/
const parseMd = (line) => {
    const STATE_NORMAL = 0,
      STATE_EXCLAMATION = 1,
      STATE_ALT = 2,
      STATE_ALT_END = 3,
      STATE_URL = 4,
      res = [],
      len = line.length;
    let state = STATE_NORMAL,
      url_start = 0;

    for (let i = 0; i < len; ++i) {
      const c = line[i];
      if (state === STATE_NORMAL) {
        if (c === "!") {
          state = STATE_EXCLAMATION;
        }
      } else if (state === STATE_EXCLAMATION) {
        if (c === "[") {
          state = STATE_ALT;
        } else {
          state = c === "!" ? STATE_EXCLAMATION : STATE_NORMAL;
        }
      } else if (state === STATE_ALT) {
        if (c === "]") {
          state = STATE_ALT_END;
        }
      } else if (state === STATE_ALT_END) {
        if (c === "(") {
          state = STATE_URL;
          url_start = i + 1;
        } else {
          state = c === "!" ? STATE_EXCLAMATION : STATE_NORMAL;
        }
      } else if (state === STATE_URL) {
        if (c === ")") {
          res.push([url_start, i, line.slice(url_start, i)]);
          state = STATE_NORMAL;
        }
      }
    }
    return res;
  },
  /*
HTML 状态机
匹配: <img ... src="url" ...>，同时跳过其他属性的值
参数: line (待解析行)
返回值: [[url_start, url_end, url], ...]
*/
  parseHtml = (line) => {
    const STATE_NORMAL = 0,
      STATE_TAG_OPEN = 1,
      STATE_IMG_I = 2,
      STATE_IMG_M = 3,
      STATE_IMG_G = 4,
      STATE_IMG_BODY = 5,
      STATE_SRC_S = 6,
      STATE_SRC_R = 7,
      STATE_SRC_C = 8,
      STATE_SRC_EQ = 9,
      STATE_SRC_VAL = 10,
      STATE_SKIP_VAL = 11,
      res = [],
      len = line.length;
    let state = STATE_NORMAL,
      url_start = 0,
      quote = "";

    for (let i = 0; i < len; ++i) {
      const c = line[i],
        low = c.toLowerCase();

      if (state === STATE_NORMAL) {
        if (c === "<") {
          state = STATE_TAG_OPEN;
        }
      } else if (state === STATE_TAG_OPEN) {
        if (low === "i") {
          state = STATE_IMG_I;
        } else {
          state = c === "<" ? STATE_TAG_OPEN : STATE_NORMAL;
        }
      } else if (state === STATE_IMG_I) {
        if (low === "m") {
          state = STATE_IMG_M;
        } else {
          state = c === "<" ? STATE_TAG_OPEN : STATE_NORMAL;
        }
      } else if (state === STATE_IMG_M) {
        if (low === "g") {
          state = STATE_IMG_G;
        } else {
          state = c === "<" ? STATE_TAG_OPEN : STATE_NORMAL;
        }
      } else if (state === STATE_IMG_G) {
        if (c === " " || c === "\t" || c === "\n" || c === "\r") {
          state = STATE_IMG_BODY;
        } else if (c === ">") {
          state = STATE_NORMAL;
        } else {
          state = c === "<" ? STATE_TAG_OPEN : STATE_NORMAL;
        }
      } else if (state === STATE_IMG_BODY) {
        if (c === ">") {
          state = STATE_NORMAL;
        } else if (low === "s") {
          state = STATE_SRC_S;
        } else if (c === '"' || c === "'") {
          quote = c;
          state = STATE_SKIP_VAL;
        }
      } else if (state === STATE_SRC_S) {
        if (c === ">") {
          state = STATE_NORMAL;
        } else if (low === "r") {
          state = STATE_SRC_R;
        } else if (c === '"' || c === "'") {
          quote = c;
          state = STATE_SKIP_VAL;
        } else {
          state = STATE_IMG_BODY;
        }
      } else if (state === STATE_SRC_R) {
        if (c === ">") {
          state = STATE_NORMAL;
        } else if (low === "c") {
          state = STATE_SRC_C;
        } else if (c === '"' || c === "'") {
          quote = c;
          state = STATE_SKIP_VAL;
        } else {
          state = STATE_IMG_BODY;
        }
      } else if (state === STATE_SRC_C) {
        if (c === ">") {
          state = STATE_NORMAL;
        } else if (c === "=") {
          state = STATE_SRC_EQ;
        } else if (c === '"' || c === "'") {
          quote = c;
          state = STATE_SKIP_VAL;
        } else if (c !== " " && c !== "\t") {
          state = STATE_IMG_BODY;
        }
      } else if (state === STATE_SRC_EQ) {
        if (c === ">") {
          state = STATE_NORMAL;
        } else if (c === '"' || c === "'") {
          quote = c;
          state = STATE_SRC_VAL;
          url_start = i + 1;
        } else if (c !== " " && c !== "\t") {
          state = STATE_IMG_BODY;
        }
      } else if (state === STATE_SRC_VAL) {
        if (c === quote) {
          res.push([url_start, i, line.slice(url_start, i)]);
          state = STATE_IMG_BODY;
        }
      } else if (state === STATE_SKIP_VAL) {
        if (c === quote) {
          state = STATE_IMG_BODY;
        }
      }
    }
    return res;
  };

export default (line) => parseMd(line).concat(parseHtml(line));
