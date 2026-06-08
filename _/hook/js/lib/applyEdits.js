export default (code, edits) => {
  if (edits.length === 0) {
    return code;
  }
  edits.sort((a, b) => b.start - a.start);
  let res = code;
  for (const edit of edits) {
    res = res.substring(0, edit.start) + edit.replacement + res.substring(edit.end);
  }
  return res;
};
