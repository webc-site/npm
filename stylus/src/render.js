import { NODE_PROP, NODE_RULE } from "./const.js";
import { GenMapping, addMapping, toEncodedMap } from "@jridgewell/gen-mapping";

/*
渲染 AST 节点列表为 CSS 字符串

evaluated_nodes: 计算后的 AST 节点列表
gen_map: 是否生成 sourcemap

返回: gen_map 为 true 时返回 [css, map]，否则返回 css 字符串
*/
export default (evaluated_nodes, gen_map = false) => {
  let gen_line = 1;
  const rendered = [],
    map = gen_map ? new GenMapping({ file: "output.css" }) : null,
    append = (text, orig_line = null, orig_file = null) => {
      if (gen_map && orig_line !== null && orig_file !== null) {
        addMapping(map, {
          generated: { line: gen_line, column: 0 },
          original: { line: orig_line, column: 0 },
          source: orig_file,
        });
      }
      rendered.push(text);
      if (text === "\n") {
        ++gen_line;
      } else if (text.includes("\n")) {
        const matches = text.match(/\n/g);
        if (matches) {
          gen_line += matches.length;
        }
      }
    },
    render = (nodes, indent) => {
      const props = [],
        imports = [],
        rules = [];
      for (const node of nodes) {
        const type = node[0];
        if (type === NODE_PROP) {
          props.push(node);
        } else if (type === NODE_RULE) {
          const sel = node[1];
          if (indent === "" && (sel.startsWith("@import") || sel.startsWith("@require"))) {
            imports.push(node);
          } else {
            rules.push(node);
          }
        }
      }

      imports.forEach((rule) => {
        const [, sel, , line, file] = rule;
        append(indent + sel + ";", line, file);
        append("\n");
      });
      if (imports.length && (props.length || rules.length)) {
        append("\n");
      }

      props.forEach((prop) => {
        const [, name, value, line, file] = prop;
        append(indent + name + ": " + value + ";", line, file);
        append("\n");
      });

      rules.forEach((rule, idx) => {
        const [, sel, children, line, file] = rule;
        let selector = sel;

        if (selector.startsWith("@media") && !selector.includes(":")) {
          selector = selector.replace(/\(([a-z-]+)\s+([^)]+)\)/g, "($1: $2)");
        }

        if (children.length === 0) {
          append(indent + selector + ";", line, file);
          append("\n");
        } else {
          append(indent + selector + " {\n", line, file);
          render(children, indent + "  ");
          append(indent + "}\n");
        }

        if (idx < rules.length - 1) {
          append("\n");
        }
      });
    };

  render(evaluated_nodes, "");

  const css = rendered.join("");
  return gen_map ? [css, toEncodedMap(map)] : css;
};
