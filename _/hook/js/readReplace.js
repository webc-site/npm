import walk from "./lib/walk.js";
import applyEdits from "./lib/applyEdits.js";
import importAdd from "./lib/importAdd.js";
import {
  CALL_EXPRESSION,
  IDENTIFIER,
  IMPORT_DECLARATION,
  LITERAL,
  MEMBER_EXPRESSION,
} from "./lib/TYPE.js";

const isReadUtf8 = (node) => {
    if (!node) return false;
    const { type, arguments: args, callee } = node;
    if (type !== CALL_EXPRESSION || args?.length !== 2) return false;

    const [, arg1] = args;
    if (arg1?.type !== LITERAL || (arg1.value !== "utf8" && arg1.value !== "utf-8")) return false;

    if (callee) {
      const { type: c_type, name } = callee;
      if (c_type === IDENTIFIER && name === "readFileSync") return true;
      if (c_type === MEMBER_EXPRESSION) {
        const { object: obj, property: prop } = callee;
        if (
          obj?.type === IDENTIFIER &&
          obj.name === "fs" &&
          prop?.type === IDENTIFIER &&
          prop.name === "readFileSync"
        ) {
          return true;
        }
      }
    }
    return false;
  },
  inspectImport = (node, state, checkImport) => {
    checkImport(node);
    const { type, source, specifiers } = node;
    if (type === IMPORT_DECLARATION && source) {
      const { value } = source;
      if (value === "fs" || value === "node:fs") {
        if (specifiers.some((i) => i.local?.name === "readFileSync")) {
          state.readFileSync_import_node = node;
        }
      }
    }
  },
  checkCall = (node, code, state, edits) => {
    const { type, callee, arguments: args, start, end } = node;
    if (type !== CALL_EXPRESSION) return;
    const is_read = callee?.type === IDENTIFIER && callee.name === "readFileSync";
    if (is_read) ++state.total_readFileSync_calls;
    if (isReadUtf8(node)) {
      if (is_read) ++state.utf8_readFileSync_calls;
      state.has_read_file_sync_call = true;
      const [arg0] = args,
        { start: arg_start, end: arg_end } = arg0;
      edits.push({
        start,
        end,
        replacement: `read(${code.substring(arg_start, arg_end)})`,
      });
    }
  },
  removeImport = (node, code, edits) => {
    const { start, end, specifiers } = node;
    edits.push({
      start,
      end,
      replacement:
        specifiers.length === 1
          ? ""
          : code
              .substring(start, end)
              .replace(/readFileSync,\s*/, "")
              .replace(/,\s*readFileSync/, "")
              .replace(/readFileSync/, ""),
    });
  };

export default (code, ast) => {
  const edits = [],
    state = {
      has_read_file_sync_call: false,
      readFileSync_import_node: null,
      total_readFileSync_calls: 0,
      utf8_readFileSync_calls: 0,
    },
    [checkImport, addImport] = importAdd("@3-/read", 'import read from "@3-/read";\n');

  walk(ast.program, (node) => {
    inspectImport(node, state, checkImport);
    checkCall(node, code, state, edits);
  });

  const {
    readFileSync_import_node: import_node,
    total_readFileSync_calls: total_calls,
    utf8_readFileSync_calls: utf8_calls,
    has_read_file_sync_call,
  } = state;

  if (import_node && total_calls === utf8_calls) {
    removeImport(import_node, code, edits);
  }

  addImport(edits, has_read_file_sync_call);

  return applyEdits(code, edits);
};
