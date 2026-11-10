import createReplace from "../lib/createReplace.js";
import { CALL_EXPRESSION, IDENTIFIER, MEMBER_EXPRESSION, NEW_EXPRESSION } from "../lib/TYPE.js";

const isTextEncoderEncode = (node) => {
  if (node?.type !== CALL_EXPRESSION || node.arguments?.length !== 1) return false;
  const { callee } = node,
    { object, property } = callee || {},
    { callee: new_callee } = object || {};
  return (
    callee?.type === MEMBER_EXPRESSION &&
    object?.type === NEW_EXPRESSION &&
    property?.type === IDENTIFIER &&
    property.name === "encode" &&
    new_callee?.type === IDENTIFIER &&
    new_callee.name === "TextEncoder"
  );
};

export default createReplace(
  "@3-/utf8/utf8e.js",
  'import utf8e from "@3-/utf8/utf8e.js";\n',
  (node, code) => {
    if (isTextEncoderEncode(node)) {
      const {
        start,
        end,
        arguments: [{ start: arg_start, end: arg_end }]
      } = node;
      return {
        start,
        end,
        replacement: "utf8e(" + code.substring(arg_start, arg_end) + ")"
      };
    }
  }
);
