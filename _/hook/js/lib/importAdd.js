import { IMPORT_DECLARATION } from "./TYPE.js";

export default (pkg, stmt) => {
  let first = -1,
    has = false;
  return [
    (node) => {
      if (node.type === IMPORT_DECLARATION) {
        if (node.source?.value === pkg) {
          has = true;
        }
        if (first === -1 || node.start < first) {
          first = node.start;
        }
      }
    },
    (edits, cond) => {
      if (cond && !has) {
        const insert_pos = first !== -1 ? first : 0;
        edits.push({
          start: insert_pos,
          end: insert_pos,
          replacement: stmt,
        });
      }
    },
  ];
};
