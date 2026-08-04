const CHAR_QUOTE = 34,
  CHAR_COMMA = 44,
  CHAR_LF = 10,
  CHAR_CR = 13,
  esc = (val) => {
    const s = val == null ? "" : val + "",
      s_len = s.length;
    let need_quote = false,
      has_quote = false;
    for (let k = 0; k < s_len; ++k) {
      const c = s.charCodeAt(k);
      if (c === CHAR_QUOTE) {
        need_quote = true;
        has_quote = true;
      } else if (c === CHAR_COMMA || c === CHAR_LF || c === CHAR_CR) {
        need_quote = true;
      }
    }
    return need_quote ? (has_quote ? '"' + s.replaceAll('"', '""') + '"' : '"' + s + '"') : s;
  };

/*
CSV 编码
row: 一维数组
返回值: CSV 单行字符串
*/
export default (row) => {
  const len = row.length;
  if (!len) return "";
  if (len === 1 && (row[0] == null || row[0] === "")) return '""';
  return row.map(esc).join(",");
};
