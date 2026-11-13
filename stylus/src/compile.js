import { existsSync } from "node:fs";
import { resolve, dirname, basename, extname, join } from "node:path";
import { ERR_OK } from "./ERR.js";
import load from "./load.js";
import run from "./run.js";
import render from "./render.js";

/*
查找依赖文件的搜索路径

main_resolved: 已解析的入口文件绝对路径
custom_paths: 自定义搜索路径列表

返回: 搜索路径数组
*/
export const lookupPaths = (main_resolved, custom_paths) => {
    const main_dir_name = dirname(main_resolved),
      lookup_paths = [main_dir_name],
      main_name = basename(main_resolved, extname(main_resolved)),
      main_dir = join(main_dir_name, main_name);
    if (custom_paths) {
      lookup_paths.push(...custom_paths.map((p) => resolve(p)));
    }
    if (existsSync(main_dir)) {
      lookup_paths.push(main_dir);
    }
    return lookup_paths;
  },
  /*
  核心编译流程，包含加载、求值、渲染

  main_resolved: 入口文件解析后的绝对路径
  file_states: 文件加载状态缓存
  lookup_paths: 搜索路径列表
  source_map: 是否生成 sourcemap
  external_import: 是否开启外部导入

  返回: [错误码, 错误数据, 渲染结果]
  */
  compileCore = (main_resolved, file_states, lookup_paths, source_map, external_import) => {
    const [err, err_data, root_nodes] = load(
      main_resolved,
      file_states,
      lookup_paths,
      external_import
    );
    if (err !== ERR_OK) {
      return [err, err_data];
    }
    const evaluated = run(root_nodes),
      res = render(evaluated, source_map);
    return [ERR_OK, null, res];
  };

/*
编译入口函数

file_path: 待编译文件路径
source_map: 是否生成 sourcemap
external_import: 是否开启外部导入

返回: 若 source_map 为 true 返回 [css, map]，否则返回 [css, null]
*/
export default (file_path, source_map = false, external_import = false) => {
  const file_states = Object.create(null),
    main_resolved = resolve(file_path),
    lookup_paths = lookupPaths(main_resolved),
    [err, err_data, res] = compileCore(
      main_resolved,
      file_states,
      lookup_paths,
      source_map,
      external_import
    );

  if (err !== ERR_OK) {
    throw [err, err_data];
  }

  return source_map ? res : [res, null];
};
