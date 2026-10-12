import createReplace from "../lib/createReplace.js";
import { LITERAL, WHILE_STATEMENT } from "../lib/TYPE.js";

export default createReplace(null, null, (node, code) => {
  const { type, test, start, body } = node;
  if (type === WHILE_STATEMENT && test) {
    const { type: t_type, value: t_val } = test;
    if (t_type === LITERAL && t_val === true) {
      const { start: body_start } = body;
      return {
        start,
        end: body_start,
        replacement: code.substring(start, body_start).replace(/while\s*\(\s*true\s*\)/, "for (;;)")
      };
    }
  }
});
