import { existsSync } from "node:fs";
import read from "@3-/read";

export default (file_path) => {
  if (!file_path || !existsSync(file_path)) return "";
  const content = read(file_path),
    line_li = content.split("\n");
  for (const line of line_li) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      return trimmed;
    }
  }
  return "";
};
