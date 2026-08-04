import read from "@3-/read";
import { existsSync } from "node:fs";

export const clean = (str) => {
    const m = str.trim().match(/^([^\s(]+)/);
    return m ? m[1] : str;
  },
  load = (dist_path) => {
    const dict = {};
    if (!existsSync(dist_path)) return dict;

    const content = read(dist_path),
      line_li = content.split("\n");
    let key = null,
      content_li = [];

    for (const line of line_li) {
      if (line.startsWith("## ")) {
        if (key !== null) {
          dict[key] = content_li.join("\n").trim();
        } else {
          dict[""] = content_li.join("\n").trim();
        }
        key = clean(line.slice(2));
        content_li = [];
      } else {
        if (key !== null) {
          content_li.push(line);
        } else if (!line.startsWith("# ")) {
          content_li.push(line);
        }
      }
    }
    if (key !== null) {
      dict[key] = content_li.join("\n").trim();
    } else {
      dict[""] = content_li.join("\n").trim();
    }
    return dict;
  };
