import walk from "./lib/walk.js";
import applyEdits from "./lib/applyEdits.js";
import importAdd from "./lib/importAdd.js";
import {
  ARROW_FUNCTION_EXPRESSION,
  BLOCK_STATEMENT,
  CALL_EXPRESSION,
  EXPRESSION_STATEMENT,
  FUNCTION_EXPRESSION,
  IDENTIFIER,
  NEW_EXPRESSION,
  RETURN_STATEMENT,
} from "./lib/TYPE.js";

const isSleepPromise = (node) => {
    if (
      node?.type !== NEW_EXPRESSION ||
      node.callee?.type !== IDENTIFIER ||
      node.callee.name !== "Promise" ||
      node.arguments?.length !== 1
    ) {
      return false;
    }
    const arg = node.arguments[0];
    if (!arg || (arg.type !== ARROW_FUNCTION_EXPRESSION && arg.type !== FUNCTION_EXPRESSION)) {
      return false;
    }
    if (!arg.params || arg.params.length === 0 || arg.params[0].type !== IDENTIFIER) {
      return false;
    }
    const resolve_name = arg.params[0].name;

    let setTimeout_call = null;
    const body = arg.body;
    if (body?.type === BLOCK_STATEMENT) {
      if (body.body?.length === 1) {
        const stmt = body.body[0];
        if (stmt.type === EXPRESSION_STATEMENT && stmt.expression?.type === CALL_EXPRESSION) {
          setTimeout_call = stmt.expression;
        } else if (stmt.type === RETURN_STATEMENT && stmt.argument?.type === CALL_EXPRESSION) {
          setTimeout_call = stmt.argument;
        }
      }
    } else if (body?.type === CALL_EXPRESSION) {
      setTimeout_call = body;
    }

    if (
      !setTimeout_call ||
      setTimeout_call.callee?.type !== IDENTIFIER ||
      setTimeout_call.callee.name !== "setTimeout" ||
      setTimeout_call.arguments?.length < 1
    ) {
      return false;
    }

    const first_arg = setTimeout_call.arguments[0];
    if (first_arg?.type !== IDENTIFIER || first_arg.name !== resolve_name) {
      return false;
    }

    return setTimeout_call;
  },
  checkNewPromise = (node, code, state, edits) => {
    const setTimeout_call = isSleepPromise(node);
    if (setTimeout_call) {
      state.has_sleep_call = true;
      const delay_arg = setTimeout_call.arguments[1],
        delay_code = delay_arg ? code.substring(delay_arg.start, delay_arg.end) : "";
      edits.push({
        start: node.start,
        end: node.end,
        replacement: "sleep(" + delay_code + ")",
      });
    }
  };

export default (code, ast) => {
  const edits = [],
    state = {
      has_sleep_call: false,
    },
    [check_import, add_import] = importAdd("@3-/sleep", 'import sleep from "@3-/sleep";\n');

  walk(ast.program, (node) => {
    check_import(node);
    checkNewPromise(node, code, state, edits);
  });

  add_import(edits, state.has_sleep_call);

  return applyEdits(code, edits);
};
