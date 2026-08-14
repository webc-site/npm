import createReplace from "./createReplace.js";
import {
  CALL_EXPRESSION,
  IDENTIFIER,
  IMPORT_DECLARATION,
  LITERAL,
  MEMBER_EXPRESSION
} from "./TYPE.js";

const isReadUtf8 = (node, func_name) => {
    if (!node) return false;
    const { type, arguments: args, callee } = node;
    if (type !== CALL_EXPRESSION || args?.length !== 2) return false;

    const [, arg1] = args;
    if (arg1?.type !== LITERAL || (arg1.value !== "utf8" && arg1.value !== "utf-8")) return false;

    if (callee) {
      const { type: c_type, name } = callee;
      if (c_type === IDENTIFIER && name === func_name) return true;
      if (c_type === MEMBER_EXPRESSION) {
        const { object: obj, property: prop } = callee;
        if (
          obj?.type === IDENTIFIER &&
          obj.name === "fs" &&
          prop?.type === IDENTIFIER &&
          prop.name === func_name
        ) {
          return true;
        }
      }
    }
    return false;
  },
  inspectImport = (node, state, func_name, import_sources) => {
    const { type, source, specifiers } = node;
    if (type === IMPORT_DECLARATION && source) {
      const { value } = source;
      if (import_sources.includes(value)) {
        if (specifiers.some((i) => i.local?.name === func_name)) {
          state.import_node = node;
        }
      }
    }
  },
  checkCall = (node, code, state, func_name) => {
    const { type, callee, arguments: args, start, end } = node;
    if (type !== CALL_EXPRESSION) return;
    const is_read = callee?.type === IDENTIFIER && callee.name === func_name;
    if (is_read) ++state.total_calls;
    if (isReadUtf8(node, func_name)) {
      if (is_read) ++state.utf8_calls;
      const [arg0] = args,
        { start: arg_start, end: arg_end } = arg0;
      return {
        start,
        end,
        replacement: "read(" + code.substring(arg_start, arg_end) + ")"
      };
    }
  },
  removeImport = (node, code, edits, func_name) => {
    const { start, end, specifiers } = node,
      regex_first = new RegExp(func_name + ",\\s*"),
      regex_last = new RegExp(",\\s*" + func_name),
      regex_only = new RegExp(func_name);

    edits.push({
      start,
      end,
      replacement:
        specifiers.length === 1
          ? ""
          : code
              .substring(start, end)
              .replace(regex_first, "")
              .replace(regex_last, "")
              .replace(regex_only, "")
    });
  };

export default (func_name, pkg, import_stmt, import_sources) => {
  return createReplace(
    pkg,
    import_stmt,
    (node, code, state) => {
      inspectImport(node, state, func_name, import_sources);
      return checkCall(node, code, state, func_name);
    },
    {
      onInit: () => ({
        import_node: null,
        total_calls: 0,
        utf8_calls: 0
      }),
      onDone: (state, code, edits) => {
        const { import_node, total_calls, utf8_calls } = state;
        if (import_node && total_calls === utf8_calls) {
          removeImport(import_node, code, edits, func_name);
        }
      }
    }
  );
};
