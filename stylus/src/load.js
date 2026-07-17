import read from "@3-/read";
import { existsSync } from "node:fs";
import { dirname, relative } from "node:path";
import WARN from "@3-/log/WARN.js";
import {
  STATE_INIT,
  STATE_LOADING,
  STATE_DONE,
  NODE_VAR,
  NODE_IMPORT,
  NODE_RULE,
  AST_LINE,
  AST_FILE
} from "./const.js";
import { ERR_OK, ERR_NOT_FOUND } from "./ERR.js";
import { isUrl, ext } from "./resolve.js";
import pathResolve from "./pathResolve.js";
import parse from "./parse.js";

/*
递归解析 AST 中的 @import/@require，加载依赖文件

parent_node: 父 AST 节点
current_dir: 当前目录
file_states: 文件加载状态缓存
lookup_paths: 依赖搜索路径列表
external_import: 是否开启外部导入

返回: [错误码, 错误数据]
*/
const expand = (parent_node, current_dir, file_states, lookup_paths, external_import) => {
    const expanded = [];
    for (const child of parent_node[2]) {
      const [type, path, line, file] = child;
      if (type === NODE_IMPORT) {
        const sub_path = pathResolve(path, current_dir, lookup_paths),
          [err, err_data, sub_nodes] = load(sub_path, file_states, lookup_paths, external_import);
        if (err !== ERR_OK) {
          if (err === ERR_NOT_FOUND && err_data === sub_path) {
            return [err, '"' + path + '" in ' + file + ":" + line];
          }
          return [err, err_data];
        }
        const is_external = external_import && !isUrl(sub_path);
        if (is_external) {
          const var_nodes = sub_nodes.filter((node) => node[0] === NODE_VAR),
            is_styl = sub_path.endsWith(".styl"),
            sub_css_path = is_styl ? sub_path.slice(0, -5) + ".css" : sub_path;
          let rel_css_path = relative(current_dir, sub_css_path);
          expanded.push(...var_nodes);
          if (!rel_css_path.startsWith(".") && !rel_css_path.startsWith("/")) {
            rel_css_path = "./" + rel_css_path;
          }
          expanded.push([NODE_RULE, '@import "' + rel_css_path + '"', [], line, file]);
        } else {
          if (isUrl(sub_path) && sub_nodes.length > 0) {
            sub_nodes[0][AST_LINE] = line;
            sub_nodes[0][AST_FILE] = file;
          }
          expanded.push(...sub_nodes);
        }
      } else {
        if (type === NODE_RULE) {
          const [err, err_data] = expand(
            child,
            current_dir,
            file_states,
            lookup_paths,
            external_import
          );
          if (err !== ERR_OK) {
            return [err, err_data];
          }
        }
        expanded.push(child);
      }
    }
    parent_node[2] = expanded;
    return [ERR_OK, null];
  },
  /*
  加载并解析指定路径的 stylus 文件

  file_path: 文件路径
  file_states: 文件加载状态缓存
  lookup_paths: 依赖搜索路径列表
  external_import: 是否开启外部导入

  返回: [错误码, 错误数据, AST 节点列表]
  */
  load = (file_path, file_states, lookup_paths, external_import) => {
    if (isUrl(file_path)) {
      return [ERR_OK, null, [[NODE_RULE, "@import " + file_path, []]]];
    }

    const resolved_path = ext(file_path),
      state = file_states[resolved_path] || STATE_INIT;

    if (state === STATE_DONE || state === STATE_LOADING) {
      if (state === STATE_LOADING) {
        WARN("Circular import detected for: " + resolved_path);
      }
      return [ERR_OK, null, []];
    }

    const virtual_content = file_states["\0content\0" + resolved_path];
    if (virtual_content === undefined && !existsSync(resolved_path)) {
      return [ERR_NOT_FOUND, resolved_path];
    }

    file_states[resolved_path] = STATE_LOADING;

    const content = virtual_content ?? read(resolved_path),
      root = parse(content, resolved_path),
      current_dir = dirname(resolved_path),
      [err, err_data] = expand(root, current_dir, file_states, lookup_paths, external_import);

    if (err !== ERR_OK) {
      return [err, err_data];
    }

    file_states[resolved_path] = STATE_DONE;

    return [ERR_OK, null, root[2]];
  };

export default load;
