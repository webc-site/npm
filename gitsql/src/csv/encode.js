const ESCAPE_CODES = [34, 44, 10, 13],
  D_QUOTE = '"',
  D_QUOTE_X2 = '""',
  BOM = "\ufeff",
  escapeVal = (val) => {
    if (val === null || val === undefined) {
      return "";
    }
    if (val instanceof Uint8Array) {
      return D_QUOTE + Buffer.from(val).toString("base64") + D_QUOTE;
    }
    const str = String(val),
      len = str.length;
    if (len === 0) {
      return D_QUOTE_X2;
    }
    let need_quote = false;
    for (let i = 0; i < len; ++i) {
      const code = str.charCodeAt(i);
      if (ESCAPE_CODES.includes(code)) {
        need_quote = true;
        break;
      }
    }
    if (!need_quote) {
      return str;
    }
    let res = D_QUOTE;
    for (let i = 0; i < len; ++i) {
      const code = str.charCodeAt(i);
      if (code === 34) {
        res += D_QUOTE_X2;
      } else {
        res += str[i];
      }
    }
    return res + D_QUOTE;
  };

// cols: 数组, rows: 生成器/迭代器
export default function* (cols, rows) {
  yield BOM + cols.map(escapeVal).join(",") + "\n";
  for (const row of rows) {
    yield cols.map((col) => escapeVal(row[col])).join(",") + "\n";
  }
}
