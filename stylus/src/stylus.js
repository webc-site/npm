import { resolve } from "node:path";
import { ERR_OK } from "./ERR.js";
import { lookupPaths, compileCore } from "./compile.js";
import { ext } from "./resolve.js";

/*
兼容官方 Stylus API 的包装函数

content: Stylus 文本内容
options: 编译配置项

返回: 兼容官方 API 链式调用的 ref 对象
*/
export default (content, options = {}) => {
  const ref = {
    options,
    define: () => ref,
    set: (key, val) => {
      options[key] = val;
      return ref;
    },
    render: () => {
      const { filename = "index.styl", paths: custom_paths, sourcemap } = options,
        file_states = Object.create(null),
        main_resolved = ext(resolve(filename)),
        lookup_paths = lookupPaths(main_resolved, custom_paths),
        source_map = !!sourcemap;

      file_states["\0content\0" + main_resolved] = content;

      const [err, err_data, res] = compileCore(
        main_resolved,
        file_states,
        lookup_paths,
        source_map
      );
      if (err !== ERR_OK) {
        throw new Error("Stylus compilation error: " + err + " " + err_data);
      }

      ref.dependencies = Object.keys(file_states).filter((k) => !k.startsWith("\0"));

      if (source_map) {
        ref.sourcemap = res[1];
        return res[0];
      }
      return res;
    },
    deps: () => ref.dependencies || []
  };
  return ref;
};
