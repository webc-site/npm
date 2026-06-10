import createReplace from "../lib/createReplace.js";
import {
  ARROW_FUNCTION_EXPRESSION,
  BLOCK_STATEMENT,
  CALL_EXPRESSION,
  EXPRESSION_STATEMENT,
  FUNCTION_EXPRESSION,
  IDENTIFIER,
  NEW_EXPRESSION,
  RETURN_STATEMENT,
} from "../lib/TYPE.js";

const promise = (node) => {
    const { type, callee, arguments: args } = node || {};
    if (
      type === NEW_EXPRESSION &&
      args?.length === 1 &&
      callee?.type === IDENTIFIER &&
      callee.name === "Promise"
    ) {
      return args[0];
    }
  },
  timeout = (body) => {
    if (!body) return null;
    const { type, body: stmts } = body;
    if (type === CALL_EXPRESSION) return body;
    if (type === BLOCK_STATEMENT && stmts?.length === 1) {
      const [stmt] = stmts,
        { type: s_type, expression, argument } = stmt;
      if (s_type === EXPRESSION_STATEMENT && expression?.type === CALL_EXPRESSION) {
        return expression;
      }
      if (s_type === RETURN_STATEMENT && argument?.type === CALL_EXPRESSION) {
        return argument;
      }
    }
    return null;
  },
  detect = (node) => {
    const cb = promise(node);
    if (!cb) return false;

    const { type, params, body } = cb;
    if (type !== ARROW_FUNCTION_EXPRESSION && type !== FUNCTION_EXPRESSION) return false;
    if (!params?.length || params[0]?.type !== IDENTIFIER) return false;

    const resolve_name = params[0].name,
      to_call = timeout(body);

    if (!to_call) return false;
    const { callee, arguments: args } = to_call;
    if (callee?.type !== IDENTIFIER || callee.name !== "setTimeout") return false;
    if (!args?.length || args[0]?.type !== IDENTIFIER || args[0].name !== resolve_name) {
      return false;
    }

    return to_call;
  };

export default createReplace("@3-/sleep", 'import sleep from "@3-/sleep";\n', (node, code) => {
  const to_call = detect(node);
  if (to_call) {
    const { start, end } = node,
      { arguments: call_args } = to_call,
      delay = call_args[1];
    let delay_code = "";
    if (delay) {
      delay_code = code.substring(delay.start, delay.end);
    }
    return {
      start,
      end,
      replacement: "sleep(" + delay_code + ")",
    };
  }
});
