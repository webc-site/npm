import walk from "../lib/walk.js";
import {
  BLOCK_STATEMENT,
  EXPORT_NAMED_DECLARATION,
  PROGRAM,
  SWITCH_CASE,
  VARIABLE_DECLARATION,
} from "../lib/TYPE.js";

const isExport = (node) => {
    const { type, declaration } = node || {};
    return (
      type === EXPORT_NAMED_DECLARATION &&
      declaration?.type === VARIABLE_DECLARATION &&
      declaration.kind === "const"
    );
  },
  isConst = (node) => {
    const { type, kind } = node || {};
    return type === VARIABLE_DECLARATION && kind === "const";
  },
  extract = (ast) => {
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
  group = (list, code, predicate) => {
    let current = [];
    const groups = [],
      isClean = (start, end) =>
        /^[;\s]*$/.test(code.substring(start, end).replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ""));

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
  scan = (ast, code) => {
    const groups = [];
    for (const list of extract(ast)) {
      for (const g of group(list, code, isExport)) {
        groups.push(["export const ", g, g[0].start, g[g.length - 1].end]);
      }
      for (const g of group(list, code, isConst)) {
        groups.push(["const ", g, g[0].start, g[g.length - 1].end]);
      }
    }
    return groups;
  },
  decls = (node) => {
    const { type, declaration, declarations } = node;
    return type === EXPORT_NAMED_DECLARATION ? declaration.declarations : declarations;
  },
  shift = (groups, start, delta) => {
    for (const group of groups) {
      if (group[2] > start) group[2] += delta;
      if (group[3] > start) group[3] += delta;
      for (const node of group[1]) {
        if (node.start > start) node.start += delta;
        if (node.end > start) node.end += delta;
        for (const d of decls(node)) {
          if (d.start > start) d.start += delta;
          if (d.end > start) d.end += delta;
        }
      }
    }
  },
  replace = (code, groups) => {
    groups.sort((a, b) => b[2] - a[2]);

    let res = code;
    const replaceRange = (r_start, r_end, replacement) => {
      const delta = replacement.length - (r_end - r_start);
      res = res.substring(0, r_start) + replacement + res.substring(r_end);
      shift(groups, r_start, delta);
    };

    for (const [, nodes] of groups) {
      for (let k = nodes.length - 2; k >= 0; --k) {
        const left = nodes[k],
          right = nodes[k + 1],
          d_start = decls(right)[0].start,
          right_start = right.start,
          text_before_d = res.substring(right_start, d_start),
          replaced_text_before_d = text_before_d.replace(/^\s*(export\s+)?const\s+/, ""),
          left_end = left.end,
          gap_start = res[left_end - 1] === ";" ? left_end - 1 : left_end,
          gap = res.substring(gap_start, right_start),
          has_semicolon = gap.includes(";"),
          replaced_gap = has_semicolon ? gap.replace(";", ",") : "," + gap;

        replaceRange(gap_start, d_start, replaced_gap + replaced_text_before_d);
      }
    }
    return res;
  };

export default (code, ast) => {
  return replace(code, scan(ast, code));
};
