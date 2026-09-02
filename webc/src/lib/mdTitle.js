import { existsSync } from "node:fs";
import read from "@3-/read";

export default (file_path, default_title = "") => {
  if (!file_path || !existsSync(file_path)) return default_title;
  const content = read(file_path),
    line_li = content.split("\n");
  for (const line of line_li) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      return trimmed.replace(/^#+\s*/, "").trim();
    }
  }
  return default_title;
};
