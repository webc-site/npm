export default async (txt) =>
  txt
    .trimEnd()
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n")
    .map((i) => i.trimEnd())
    .join("\n");
