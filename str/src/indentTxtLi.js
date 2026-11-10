const SPACE = 32,
  TAB = 9,
  VT = 11,
  FF = 12,
  CR = 13,
  LF = 10;

export default (md) => {
  const len = md.length,
    res = [];
  if (len === 0) {
    res.push(["", ""]);
    return res;
  }
  let i = 0,
    next_cr = md.indexOf("\r", i);
  while (i < len) {
    const indent_start = i;
    while (i < len && (md.charCodeAt(i) === SPACE || md.charCodeAt(i) === TAB)) {
      ++i;
    }
    const indent = md.slice(indent_start, i),
      content_start = i,
      next_lf = md.indexOf("\n", i);
    if (next_cr !== -1 && i > next_cr) {
      next_cr = md.indexOf("\r", i);
    }
    const line_end =
      next_lf === -1
        ? next_cr === -1
          ? len
          : next_cr
        : next_cr !== -1 && next_cr < next_lf
          ? next_cr
          : next_lf;

    let content_end = line_end;
    while (content_end > content_start) {
      const code = md.charCodeAt(content_end - 1);
      if (code !== SPACE && code !== TAB && code !== VT && code !== FF) {
        break;
      }
      --content_end;
    }

    res.push([indent, md.slice(content_start, content_end)]);

    if (line_end < len) {
      i =
        md.charCodeAt(line_end) === CR && line_end + 1 < len && md.charCodeAt(line_end + 1) === LF
          ? line_end + 2
          : line_end + 1;
      if (i === len) {
        res.push(["", ""]);
      }
    } else {
      i = len;
    }
  }
  return res;
};
