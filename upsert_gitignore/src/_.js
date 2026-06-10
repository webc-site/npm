import read from "@3-/read";
import { existsSync } from "fs";
import txtLi from "@3-/txt_li";
import write from "@3-/write";

export default (path, line) => {
  if (!existsSync(path)) {
    write(path, line + "\n");
    return;
  }
  const li = txtLi(read(path));
  if (!li.includes(line)) {
    li.push(line);
    write(path, li.join("\n") + "\n");
  }
};
