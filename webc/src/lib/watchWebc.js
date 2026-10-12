import { watch } from "node:fs";
import { join } from "node:path";
import ls from "./ls.js";

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export default (root) => {
  const webc_dir = join(root, "src", "webc"),
    triggerGen = debounce(async () => {
      try {
        console.log("change detected in src/webc. regenerating ls files...");
        await ls(root, join(root, "src", "_/ls"));
      } catch (err) {
        console.error("error generating ls files:", err);
      }
    }, 100),
    watcher = watch(webc_dir, (event_type, file_name) => {
      if (
        file_name &&
        !file_name.startsWith(".") &&
        file_name.endsWith(".js") &&
        event_type === "rename"
      ) {
        triggerGen();
      }
    });

  return watcher;
};
