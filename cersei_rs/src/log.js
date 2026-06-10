import { stdout } from "node:process";
import { MSG_ERR, MSG_TOOL, MSG_TXT, MSG_THINK } from "./MSG.js";

const MSG = {
  [MSG_ERR]: "ERR",
  [MSG_TOOL]: "TOOL",
  [MSG_TXT]: "TXT",
  [MSG_THINK]: "THINK",
};

export default async (stream) => {
  let lastType;
  let lastTxt = "";
  for await (const [type, content, args] of stream) {
    if (type !== lastType) {
      if (type === MSG_TXT) {
        lastTxt = "";
      }
    }
    if (type == MSG_TOOL) {
      stdout.write("\x1b[32m" + content + "\x1b[0m \x1b[90m" + args + "\x1b[0m\n");
    } else {
      if (type !== lastType) {
        stdout.write("\n\x1b[90m" + MSG[type] + ":\x1b[0m ");
      }
      stdout.write(content);
    }
    if (type == MSG_TXT) {
      lastTxt += content;
    }
    lastType = type;
  }
  stdout.write("\n");
  return lastTxt;
};
