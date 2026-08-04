import { parse } from "yuku-parser";
import isObj from "@3-/is_obj";

// 递归遍历 AST 节点
const walk = (node, onNode) => {
  if (!isObj(node)) return;
  onNode(node);
  for (const key in node) {
    const val = node[key];
    if (Array.isArray(val)) {
      val.forEach((item) => walk(item, onNode));
    } else {
      walk(val, onNode);
    }
  }
};

/*
code: 待解析的 JS 代码
返回: [ 静态导入模块名数组, 动态导入模块名数组 ]
*/
export default (code) => {
  const static_li = [],
    dynamic_li = [],
    template_li = [],
    res = parse(code);
  if (res.program) {
    walk(res.program, (node) => {
      const { type: node_type, source } = node;
      if (source) {
        const is_static = [
            "ImportDeclaration",
            "ExportNamedDeclaration",
            "ExportAllDeclaration"
          ].includes(node_type),
          is_dynamic = node_type === "ImportExpression";
        if (is_static || is_dynamic) {
          // 提取导入模块名
          const { type, value, expressions, quasis } = source;
          if (type === "Literal") {
            (is_static ? static_li : dynamic_li).push(value);
          } else if (type === "TemplateLiteral") {
            if (expressions.length === 0 && quasis.length === 1) {
              (is_static ? static_li : dynamic_li).push(quasis[0].value.cooked);
            } else if (is_dynamic && expressions.length > 0 && quasis.length > 0) {
              template_li.push(quasis.map((q) => q.value.cooked));
            }
          }
        }
      }
    });
  }
  return [static_li, dynamic_li, template_li];
};
