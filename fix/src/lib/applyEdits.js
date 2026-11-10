export default (code, edits) => {
  if (edits.length === 0) return code;
  edits.sort((a, b) => b.start - a.start);
  let res = code;
  for (const { start, end, replacement } of edits) {
    res = res.substring(0, start) + replacement + res.substring(end);
  }
  return res;
};
