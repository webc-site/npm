import { IMPORT_DECLARATION } from "./TYPE.js";

export default (pkg, stmt) => {
  let first = -1,
    has = false;
  return [
    (node) => {
      const { type, source, start } = node;
      if (type === IMPORT_DECLARATION) {
        if (source?.value === pkg) has = true;
        if (first === -1 || start < first) first = start;
      }
    },
    (edits, cond) => {
      if (cond && !has) {
        const pos = first !== -1 ? first : 0;
        edits.push({ start: pos, end: pos, replacement: stmt });
      }
    }
  ];
};
