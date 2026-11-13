import createReplace from "../lib/createReplace.js";
import { MEMBER_EXPRESSION, IDENTIFIER } from "../lib/TYPE.js";

export default createReplace("node:process", 'import { env } from "node:process";\n', (node) => {
  const { type, computed, object, property, start, end } = node;
  if (
    type === MEMBER_EXPRESSION &&
    !computed &&
    object?.type === IDENTIFIER &&
    object.name === "process" &&
    property?.type === IDENTIFIER &&
    property.name === "env"
  ) {
    return {
      start,
      end,
      replacement: "env"
    };
  }
});
