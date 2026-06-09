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

const isSleep = (node) => {
    if (!node) return false;
    const { type, callee, arguments: args } = node;
    if (type !== NEW_EXPRESSION || args?.length !== 1) return false;

    if (callee?.type !== IDENTIFIER || callee.name !== "Promise") return false;

    const [arg] = args;
    if (!arg) return false;
    const { type: arg_type, params, body } = arg;
    if (arg_type !== ARROW_FUNCTION_EXPRESSION && arg_type !== FUNCTION_EXPRESSION) {
      return false;
    }
    if (!params?.length) return false;
    const [first] = params;
    if (first?.type !== IDENTIFIER) return false;
    const { name: resolve_name } = first;

    let to_call = null;
    if (body) {
      const { type: b_type, body: stmts } = body;
      if (b_type === BLOCK_STATEMENT) {
        if (stmts?.length === 1) {
          const [stmt] = stmts,
            { type: s_type, expression: expr, argument: arg } = stmt;
          if (s_type === EXPRESSION_STATEMENT && expr?.type === CALL_EXPRESSION) {
            to_call = expr;
          } else if (s_type === RETURN_STATEMENT && arg?.type === CALL_EXPRESSION) {
            to_call = arg;
          }
        }
      } else if (b_type === CALL_EXPRESSION) {
        to_call = body;
      }
    }

    if (!to_call) return false;
    const { callee: call_callee, arguments: call_args } = to_call;
    if (call_callee?.type !== IDENTIFIER || call_callee.name !== "setTimeout") return false;
    if (!call_args?.length) return false;

    const [first_arg] = call_args;
    if (first_arg?.type !== IDENTIFIER || first_arg.name !== resolve_name) {
      return false;
    }

    return to_call;
  },
  checkNew = (node, code, state, edits) => {
    const to_call = isSleep(node);
    if (to_call) {
      state.has_sleep_call = true;
      const { arguments: call_args } = to_call,
        delay = call_args[1];
      let delay_code = "";
      if (delay) {
        const { start, end } = delay;
        delay_code = code.substring(start, end);
      }
      const { start, end } = node;
      edits.push({
        start,
        end,
        replacement: `sleep(${delay_code})`,
      });
    }
  };

export default (code, ast) => {
  const edits = [],
    state = {
      has_sleep_call: false,
    },
    [checkImport, addImport] = importAdd("@3-/sleep", 'import sleep from "@3-/sleep";\n');

  walk(ast.program, (node) => {
    checkImport(node);
    checkNew(node, code, state, edits);
  });

  addImport(edits, state.has_sleep_call);

  return applyEdits(code, edits);
};
