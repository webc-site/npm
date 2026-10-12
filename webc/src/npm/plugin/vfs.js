import { dirname } from "node:path";
import { TRANSFORM_LI } from "../../lib/vfs.js";

export default {
  name: "vfs-plugin",
  transform: (code, id) => {
    const [path_name] = id.split("?");
    for (const [suffix, fn] of TRANSFORM_LI) {
      if (suffix.endsWith("I18N.js")) continue;
      if (path_name.endsWith("/" + suffix)) {
        let dir = path_name;
        const depth = suffix.split("/").length;
        for (let i = 0; i < depth; ++i) {
          dir = dirname(dir);
        }
        let res = fn(code, dir);
        if (res !== code) {
          return {
            code: res
          };
        }
      }
    }
  }
};
