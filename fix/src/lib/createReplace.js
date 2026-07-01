import walk from "./walk.js";
import applyEdits from "./applyEdits.js";
import importAdd from "./importAdd.js";

export default (pkg, import_stmt, checkNode, { onInit, onDone } = {}) => {
  return (code, ast) => {
    const edits = [],
      [checkImport, addImport] = pkg ? importAdd(pkg, import_stmt) : [null, null],
      state = onInit ? onInit() : null;
    let has = false;

    walk(ast.program, (node) => {
      if (checkImport) checkImport(node);
      const replacement = checkNode(node, code, state);
      if (replacement) {
        has = true;
        edits.push(replacement);
      }
    });

    if (onDone) onDone(state, code, edits);
    if (addImport) addImport(edits, has);

    return applyEdits(code, edits);
  };
};
