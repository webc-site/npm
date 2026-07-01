import { rolldown } from "rolldown";
import write from "@3-/write";
import merge from "@3-/merge";
import { resolve, dirname, join } from "node:path";

const CONF = {
    treeshake: {
      unknownGlobalSideEffects: false,
      moduleSideEffects: false,
    },
  },
  // 调用 rolldown 打包，返回所有 chunk [[最终输出绝对路径, code, map], ...]
  build = async (opt, minify, dist_dir, out_map) => {
    const { output, file, ...input_opt } = opt,
      res = await rolldown(input_opt),
      { output: chunks } = await res.generate(
        merge(
          {
            format: "esm",
            minify: minify || "dce-only",
            sourcemap: true,
          },
          output || {},
        ),
      );
    return chunks
      .filter((c) => c.type === "chunk")
      .map(({ facadeModuleId, fileName, code, map }) => {
        const abs_out_path = facadeModuleId
          ? out_map?.[facadeModuleId] || file
          : join(dist_dir || dirname(file), fileName);
        return [abs_out_path, code, map];
      });
  },
  // 计算所有 chunk 代码的总长度
  totalSize = (chunks) => chunks.reduce((acc, [, code]) => acc + code.length, 0),
  // 迭代直至代码大小不再变化
  pass = async (func, size = Infinity) => {
    const r = await func(),
      len = totalSize(r);
    if (len < size) {
      return pass(func, len);
    }
    return r;
  },
  // 内存加载插件，支持多文件绝对输出路径映射加载，完美解析虚拟公共 chunk 的相对引入
  plug = (code_map) => ({
    name: "memory-plugin",
    resolveId: (id, importer) => {
      if (code_map[id]) return id;
      if (importer && id.startsWith(".")) {
        const abs_path = resolve(dirname(importer), id);
        if (code_map[abs_path]) {
          return abs_path;
        }
      }
      return undefined;
    },
    load: (id) => {
      const item = code_map[id];
      if (item) {
        const { code, map } = item;
        return { code, map };
      }
      return undefined;
    },
  }),
  /*
  入参 input 可以为单个文件或多个文件路径数组，opt 额外配置，minify 是否压缩
  返回 数组的数组 [[文件名/标识符, 打包代码, sourcemap], ...]
  */
  bundle = async (input, opt, minify, dist_dir, out_map) => {
    const inputs = (Array.isArray(input) ? input : [input]).map((p) => resolve(p)),
      opt_val = merge(
        {
          input: inputs,
          file: inputs[0],
        },
        CONF,
        opt || {},
      ),
      { plugins } = opt_val;

    let opt_run = opt_val,
      code_map = {},
      chunks;

    const run = async (mini) => {
      const r = await build(opt_run, mini, dist_dir || dirname(inputs[0]), out_map);
      for (const [key, code, map] of r) {
        code_map[key] = { code, map };
      }
      return r;
    };

    chunks = await run(false);

    if (minify) {
      opt_run = {
        ...opt_val,
        input: inputs,
      };
      chunks = await pass(async () => {
        opt_run.plugins = [...(plugins || []), plug(code_map)];
        return run(minify);
      }, totalSize(chunks));
    }

    return chunks.map(([key, code, map]) => {
      const idx = code.lastIndexOf("\n");
      return [
        key,
        idx !== -1 && code.slice(idx + 1).startsWith("//# sourceMappingURL=")
          ? code.slice(0, idx)
          : code,
        map,
      ];
    });
  };

export const minifyTo = async (input, file, opt = {}) => {
  const is_arr = Array.isArray(input),
    inputs = (is_arr ? input : [input]).map((p) => resolve(p)),
    files = is_arr ? file : [file],
    dist_dir = dirname(files[0]),
    path_to_file = {};

  inputs.forEach((inp, idx) => {
    path_to_file[inp] = files[idx];
  });

  const chunks = await bundle(inputs, opt, true, dist_dir, path_to_file);

  for (const [out_file, code, map] of chunks) {
    if (out_file) {
      write(out_file, code);
      if (map) {
        write(out_file + ".map", JSON.stringify(map));
      }
    }
  }
};

export default bundle;
