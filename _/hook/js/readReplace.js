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

const isReadFileSyncUtf8 = (node) => {
    if (!node || node.type !== CALL_EXPRESSION) {
      return false;
    }
    const { arguments: args, callee } = node;
    if (args?.length !== 2 || args[1]?.type !== LITERAL) {
      return false;
    }
    const val = args[1].value;
    if (val !== "utf8" && val !== "utf-8") {
      return false;
    }
    if (callee?.type === IDENTIFIER && callee.name === "readFileSync") {
      return true;
    }
    if (callee?.type === MEMBER_EXPRESSION) {
      const { object, property } = callee;
      return (
        object?.type === IDENTIFIER &&
        object.name === "fs" &&
        property?.type === IDENTIFIER &&
        property.name === "readFileSync"
      );
    }
    return false;
  },
  inspectImport = (node, state, checkImport) => {
    checkImport(node);
    if (node.type !== IMPORT_DECLARATION) {
      return;
    }
    const { source, specifiers } = node;
    if (source && (source.value === "fs" || source.value === "node:fs")) {
      const has_read_file_sync = specifiers.some((i) => i.local && i.local.name === "readFileSync");
      if (has_read_file_sync) {
        state.readFileSync_import_node = node;
      }
    }
  },
  checkCall = (node, code, state, edits) => {
    if (node.type !== CALL_EXPRESSION) {
      return;
    }
    const { callee, arguments: args, start, end } = node,
      is_read = callee?.type === IDENTIFIER && callee.name === "readFileSync";
    if (is_read) {
      ++state.total_readFileSync_calls;
    }
    if (isReadFileSyncUtf8(node)) {
      if (is_read) {
        ++state.utf8_readFileSync_calls;
      }
      state.has_read_file_sync_call = true;
      const arg_0 = code.substring(args[0].start, args[0].end);
      edits.push({
        start,
        end,
        replacement: "read(" + arg_0 + ")",
      });
    }
  },
  removeImport = (node, code, edits) => {
    const { start, end, specifiers } = node,
      import_code = code.substring(start, end);
    let new_import_code = import_code;
    if (specifiers.length === 1) {
      new_import_code = "";
    } else {
      new_import_code = new_import_code
        .replace(/readFileSync,\s*/, "")
        .replace(/,\s*readFileSync/, "")
        .replace(/readFileSync/, "");
    }
    edits.push({
      start,
      end,
      replacement: new_import_code,
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
