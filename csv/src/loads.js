import csvD from "./csvD.js";

export default (str) => {
  const res = [],
    len = str.length;
  /*
  in_quote: 0 不在引号内, 1 在引号内
  */
  let in_quote = 0,
    start = 0,
    i = 0;
  while (i < len) {
    const code = str.charCodeAt(i);
    /* 34: 双引号 " */
    if (code === 34) {
      if (in_quote) {
        /* 34: 双引号 " */
        if (str.charCodeAt(i + 1) === 34) {
          ++i;
        } else {
          in_quote = 0;
        }
      } else {
        in_quote = 1;
      }
      /* 10: 换行 \n, 13: 回车 \r */
    } else if (!in_quote && (code === 10 || code === 13)) {
      res.push(csvD(str.slice(start, i)));
      /* 13: 回车 \r, 10: 换行 \n */
      if (code === 13 && str.charCodeAt(i + 1) === 10) {
        ++i;
      }
      start = i + 1;
    }
    ++i;
  }
  if (start < len) {
    res.push(csvD(str.slice(start)));
  }
  return res;
};
