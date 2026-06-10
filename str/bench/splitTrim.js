export default (md) => {
  if (md.length === 0) {
    return [["", ""]];
  }
  const lines = md.split(/\r?\n/),
    res = [];
  for (const line of lines) {
    const trimmed = line.trimStart(),
      indent = line.slice(0, line.length - trimmed.length),
      content = trimmed.trimEnd();
    res.push([indent, content]);
  }
  return res;
};
