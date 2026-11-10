export default (md) =>
  md
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n")
    .map((i) => i.trimEnd());
