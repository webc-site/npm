const make_data = (cols, quote_ratio) => {
    const row = [],
      chars = "abcdefghijklmnopqrstuvwxyz ",
      randStr = (has_quote) => {
        let s = "";
        const len = 5 + Math.floor(Math.random() * 15);
        for (let i = 0; i < len; ++i) {
          s += chars[Math.floor(Math.random() * chars.length)];
        }
        if (has_quote) {
          s += ',"' + "\n";
        }
        return s;
      };
    for (let j = 0; j < cols; ++j) {
      row.push(randStr(Math.random() < quote_ratio));
    }
    return row;
  },
  small_unquoted = make_data(20, 0),
  medium_unquoted = make_data(1000, 0),
  small_quoted = make_data(20, 0.5),
  medium_quoted = make_data(1000, 0.5);

export default [
  ["small_unquoted", small_unquoted],
  ["medium_unquoted", medium_unquoted],
  ["small_quoted", small_quoted],
  ["medium_quoted", medium_quoted],
];
