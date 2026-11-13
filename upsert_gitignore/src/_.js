import read from "@3-/read";
import { existsSync } from "fs";
import txtLi from "@3-/txt_li";
import write from "@3-/write";

export default (path, ignore_li) => {
  const li = existsSync(path) ? txtLi(read(path)) : [],
    new_li = ignore_li.filter((x) => !li.includes(x));
  if (new_li.length) {
    write(path, li.concat(new_li).join("\n") + "\n");
  }
};
