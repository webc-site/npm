import { parse } from "yuku-parser";
import read from "@3-/read";
import { existsSync } from "node:fs";

/*
file_path: 文件绝对路径
返回: 导出名称的数组
*/
const pick = (node, name_li) => {
  if (!node) return;
  const { type } = node;
  if (type === "Identifier") {
    name_li.push(node.name);
  } else if (type === "ArrayPattern") {
    node.elements.forEach((elem) => pick(elem, name_li));
  } else if (type === "ObjectPattern") {
    node.properties.forEach((prop) => {
      const { type: prop_type } = prop;
      if (prop_type === "Property") {
        pick(prop.value, name_li);
      } else if (prop_type === "RestElement") {
        pick(prop.argument, name_li);
      }
    });
  } else if (type === "AssignmentPattern") {
    pick(node.left, name_li);
  } else if (type === "RestElement") {
    pick(node.argument, name_li);
  }
};

export default (file_path) => {
  if (!existsSync(file_path)) {
    return;
  }

  const export_li = [],
    code = read(file_path);

  if (!code) {
    return export_li;
  }

  try {
    const res = parse(code);
    if (res.program && Array.isArray(res.program.body)) {
      res.program.body.forEach((node) => {
        const { type, declaration, specifiers, exported } = node;
        if (type === "ExportDefaultDeclaration") {
          export_li.push("default");
        } else if (type === "ExportNamedDeclaration") {
          if (declaration) {
            const { type: decl_type, declarations, id } = declaration;
            if (decl_type === "VariableDeclaration") {
              declarations.forEach((decl) => pick(decl.id, export_li));
            } else if (
              (decl_type === "FunctionDeclaration" || decl_type === "ClassDeclaration") &&
              id
            ) {
              export_li.push(id.name);
            }
          }
          if (Array.isArray(specifiers)) {
            specifiers.forEach(({ exported: spec_exported }) => {
              if (spec_exported) {
                export_li.push(spec_exported.name);
              }
            });
          }
        } else if (type === "ExportAllDeclaration" && exported) {
          export_li.push(exported.name);
        }
      });
    }
  } catch {}

  return export_li;
};
