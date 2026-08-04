import { NODE_IMPORT, NODE_VAR, NODE_PROP, NODE_RULE, NODE_COMMENT } from "./const.js";

const COMPACT_TYPES = new Set([NODE_IMPORT, NODE_VAR]),
  hex = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0"),
  parseVal = (val, max) => (val.endsWith("%") ? (parseFloat(val) / 100) * max : parseFloat(val)),
  rgbaHex = (str) =>
    str
      .replace(
        /rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*(?:,\s*([\d.]+%?)\s*)?\)/gi,
        (_, r, g, b, a) => {
          const r_val = parseVal(r, 255),
            g_val = parseVal(g, 255),
            b_val = parseVal(b, 255),
            a_val = a === undefined ? 1 : parseVal(a, 1);
          return "#" + hex(r_val) + hex(g_val) + hex(b_val) + (a_val === 1 ? "" : hex(a_val * 255));
        }
      )
      .replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, (m) => {
        if (m.length === 9) {
          const r1 = m[1],
            r2 = m[2],
            g1 = m[3],
            g2 = m[4],
            b1 = m[5],
            b2 = m[6],
            a1 = m[7],
            a2 = m[8];
          if (a1.toLowerCase() === "f" && a2.toLowerCase() === "f") {
            if (r1 === r2 && g1 === g2 && b1 === b2) {
              return "#" + r1 + g1 + b1;
            }
            return "#" + r1 + r2 + g1 + g2 + b1 + b2;
          }
          if (r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2) {
            return "#" + r1 + g1 + b1 + a1;
          }
        } else if (m.length === 7) {
          const r1 = m[1],
            r2 = m[2],
            g1 = m[3],
            g2 = m[4],
            b1 = m[5],
            b2 = m[6];
          if (r1 === r2 && g1 === g2 && b1 === b2) {
            return "#" + r1 + g1 + b1;
          }
        }
        return m;
      }),
  isCompact = (prev, curr) => prev === curr && COMPACT_TYPES.has(curr),
  dedupe = (li) => {
    if (!li) return [];
    const prop_map = new Map(),
      var_map = new Map();

    for (let i = li.length - 1; i >= 0; --i) {
      const node = li[i],
        [type, name] = node;
      if (type === NODE_PROP) {
        if (!prop_map.has(name)) {
          prop_map.set(name, node);
        }
      } else if (type === NODE_VAR) {
        if (!var_map.has(name)) {
          var_map.set(name, node);
        }
      }
    }

    return li.filter((node) => {
      const [type, name] = node;
      if (type === NODE_PROP) {
        return prop_map.get(name) === node;
      }
      if (type === NODE_VAR) {
        return var_map.get(name) === node;
      }
      return true;
    });
  },
  render = (node, indent = "", prev_node) => {
    const [type] = node,
      { comment } = node,
      [prev_type] = prev_node || [];
    switch (type) {
      case NODE_COMMENT: {
        const [, text] = node;
        return indent + text + "\n";
      }
      case NODE_RULE: {
        const [, sel, li] = node;
        let res = "";
        if (prev_type !== undefined && prev_type !== NODE_COMMENT && indent) {
          res += "\n";
        }
        res += indent + sel;
        if (comment) {
          res += " " + comment;
        }
        res += "\n";
        if (li?.length) {
          const clean_li = dedupe(li);
          res += clean_li.map((c, i) => render(c, indent + "  ", clean_li[i - 1])).join("");
        }
        return res;
      }
      case NODE_IMPORT:
      case NODE_VAR:
      case NODE_PROP: {
        let res = "";
        if (type === NODE_IMPORT) {
          const [, target] = node;
          res = target.startsWith("url(")
            ? indent + "@import " + target
            : indent + '@import "' + target + '"';
        } else {
          const [, name, val] = node;
          res = indent + name + (type === NODE_VAR ? " = " : " ") + rgbaHex(val);
        }
        if (comment) {
          res += " " + comment;
        }
        return res + "\n";
      }
      default:
        return "";
    }
  };

export default (ast) => {
  const [, , li] = ast;
  if (!li) return "";
  const clean_li = dedupe(li);
  let res = "";
  clean_li.forEach((c, i) => {
    const r = render(c, "", clean_li[i - 1]);
    if (i > 0) {
      const [prev_type] = clean_li[i - 1],
        [type] = c;
      res += isCompact(prev_type, type) ? r : "\n" + r;
    } else {
      res += r;
    }
  });
  return res.trim() + "\n";
};
