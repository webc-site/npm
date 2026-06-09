import walk from "./lib/walk.js";
import {
  BLOCK_STATEMENT,
  EXPORT_NAMED_DECLARATION,
  PROGRAM,
  SWITCH_CASE,
  VARIABLE_DECLARATION,
} from "./lib/TYPE.js";

const isExportConst = (node) => {
    const { type, declaration } = node || {};
    return (
      type === EXPORT_NAMED_DECLARATION &&
      declaration?.type === VARIABLE_DECLARATION &&
      declaration.kind === "const"
    );
  },
  isPlainConst = (node) => {
    const { type, kind } = node || {};
    return type === VARIABLE_DECLARATION && kind === "const";
  },
  bodyLists = (ast) => {
    const lists = [];
    walk(ast, ({ type, body, consequent }) => {
      if ((type === PROGRAM || type === BLOCK_STATEMENT) && Array.isArray(body)) {
        lists.push(body);
      } else if (type === SWITCH_CASE && Array.isArray(consequent)) {
        lists.push(consequent);
      }
    });
    return lists;
  },
  findGroups = (list, code, predicate) => {
    let current = [];
    const groups = [],
      isClean = (start, end) => /^[;\s]*$/.test(code.substring(start, end));

    for (const node of list) {
      if (predicate(node)) {
        if (current.length === 0) {
          current.push(node);
        } else {
          const { end: last_end } = current[current.length - 1],
            { start } = node;
          if (isClean(last_end, start)) {
            current.push(node);
          } else {
            if (current.length > 1) groups.push(current);
            current = [node];
          }
        }
      } else {
        if (current.length > 1) groups.push(current);
        current = [];
      }
    }
    if (current.length > 1) groups.push(current);
    return groups;
  },
  collectGroups = (ast, code) => {
    const groups = [];
    for (const list of bodyLists(ast)) {
      for (const g of findGroups(list, code, isExportConst)) {
        groups.push(["export const ", g, g[0].start, g[g.length - 1].end]);
      }
      for (const g of findGroups(list, code, isPlainConst)) {
        groups.push(["const ", g, g[0].start, g[g.length - 1].end]);
      }
    }
    return groups;
  },
  decls = (node) => {
    const { type, declaration, declarations } = node;
    return type === EXPORT_NAMED_DECLARATION ? declaration.declarations : declarations;
  },
  indent = (code, start) => {
    let idx = start - 1;
    const chars = [];
    while (idx >= 0 && code[idx] !== "\n") chars.unshift(code[idx--]);
    const match = chars.join("").match(/^\s*/);
    return match ? match[0] : "";
  },
  replaceGroups = (code, groups) => {
    for (const [, nodes] of groups) {
      for (const node of nodes) {
        node.d_end = node.end;
        for (const d of decls(node)) d.d_end = d.end;
      }
    }

    groups.sort((a, b) => b[2] - a[2]);

    let res = code;
    for (let i = 0; i < groups.length; ++i) {
      const [prefix, nodes, start, end] = groups[i],
        declarators = nodes.flatMap(decls),
        indent_str = indent(res, start),
        separator = ",\n" + indent_str + "  ",
        merged = declarators
          .map(({ start: d_start, d_end }) => res.substring(d_start, d_end))
          .join(separator),
        replacement = prefix + merged + ";",
        delta = replacement.length - (end - start);

      res = res.substring(0, start) + replacement + res.substring(end);

      for (let j = i + 1; j < groups.length; ++j) {
        const g_next = groups[j];
        if (g_next[3] > start) {
          g_next[3] += delta;
          for (const n of g_next[1]) {
            if (n.d_end > start) n.d_end += delta;
            for (const d of decls(n)) {
              if (d.d_end > start) d.d_end += delta;
            }
          }
        }
      }
    }
    return res;
  };

export default (code, ast) => {
  return replaceGroups(code, collectGroups(ast, code));
};
