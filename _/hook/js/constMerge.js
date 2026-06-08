import walk from "./lib/walk.js";
import {
  BLOCK_STATEMENT,
  EXPORT_NAMED_DECLARATION,
  PROGRAM,
  SWITCH_CASE,
  VARIABLE_DECLARATION,
} from "./lib/TYPE.js";

const isExportConst = (node) => {
    if (!node) return false;
    const { type, declaration } = node;
    return (
      type === EXPORT_NAMED_DECLARATION &&
      declaration?.type === VARIABLE_DECLARATION &&
      declaration.kind === "const"
    );
  },
  isPlainConst = (node) => {
    if (!node) return false;
    const { type, kind } = node;
    return type === VARIABLE_DECLARATION && kind === "const";
  },
  bodyLists = (ast) => {
    const lists = [];
    walk(ast, (node) => {
      const { type, body, consequent } = node;
      if (type === PROGRAM || type === BLOCK_STATEMENT) {
        if (Array.isArray(body)) {
          lists.push(body);
        }
      } else if (type === SWITCH_CASE) {
        if (Array.isArray(consequent)) {
          lists.push(consequent);
        }
      }
    });
    return lists;
  },
  findGroups = (list, code, predicate) => {
    let current_group = [];
    const groups = [],
      isCleanBetween = (start, end) => /^[;\s]*$/.test(code.substring(start, end));

    for (const node of list) {
      if (predicate(node)) {
        if (current_group.length === 0) {
          current_group.push(node);
        } else {
          const last_node = current_group[current_group.length - 1];
          if (isCleanBetween(last_node.end, node.start)) {
            current_group.push(node);
          } else {
            if (current_group.length > 1) {
              groups.push(current_group);
            }
            current_group = [node];
          }
        }
      } else {
        if (current_group.length > 1) {
          groups.push(current_group);
        }
        current_group = [];
      }
    }
    if (current_group.length > 1) {
      groups.push(current_group);
    }
    return groups;
  },
  collectGroups = (ast, code) => {
    const lists = bodyLists(ast),
      groups = [];
    for (const list of lists) {
      const export_groups = findGroups(list, code, isExportConst),
        plain_groups = findGroups(list, code, isPlainConst);

      for (const g of export_groups) {
        groups.push(["export const ", g, g[0].start, g[g.length - 1].end]);
      }
      for (const g of plain_groups) {
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
    while (idx >= 0 && code[idx] !== "\n") {
      chars.unshift(code[idx]);
      --idx;
    }
    const line_head = chars.join(""),
      match = line_head.match(/^\s*/);
    return match ? match[0] : "";
  },
  replaceGroups = (code, groups) => {
    for (const [, nodes] of groups) {
      for (const node of nodes) {
        node.d_end = node.end;
        for (const decl of decls(node)) {
          decl.d_end = decl.end;
        }
      }
    }

    groups.sort((a, b) => b[2] - a[2]);

    let res = code,
      i = 0,
      j = 0;
    for (; i < groups.length; ++i) {
      const [prefix, nodes, start, end] = groups[i],
        declarators = [];

      for (const node of nodes) {
        declarators.push(...decls(node));
      }

      const indent_str = indent(res, start),
        separator = ",\n" + indent_str + "  ",
        merged = declarators.map((d) => res.substring(d.start, d.d_end)).join(separator),
        replacement = prefix + merged + ";",
        delta = replacement.length - (end - start);

      res = res.substring(0, start) + replacement + res.substring(end);

      for (j = i + 1; j < groups.length; ++j) {
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
