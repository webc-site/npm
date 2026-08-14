import read from "@3-/read";
import { parse } from "yuku-parser";

export const TYPE_FUNCTION = 1;
const TYPE_CONST = 2,
  TYPE_EXPORT = 3,
  DEFAULT = "default",
  FUNC_DEC = "FunctionDeclaration",
  FUNC_EXP = "FunctionExpression",
  ARROW_EXP = "ArrowFunctionExpression",
  IDENTIFIER = "Identifier",
  paramName = (param) => {
    const { type, name, left, argument } = param;
    switch (type) {
      case IDENTIFIER:
        return name;
      case "AssignmentPattern":
        return paramName(left);
      case "RestElement":
        return "..." + paramName(argument);
      case "ObjectPattern":
        return "{...}";
      case "ArrayPattern":
        return "[...]";
      default:
        return "?";
    }
  },
  paramStr = (param_li) => param_li.map(paramName).join(", ");

export default (file_path) => {
  const code = read(file_path),
    res = parse(code),
    export_li = [];

  if (res.program && res.program.body) {
    for (const node of res.program.body) {
      const { type, declaration, specifiers: specifier_li } = node;
      if (type === "ExportNamedDeclaration") {
        if (declaration) {
          const { type: dec_type } = declaration;
          if (dec_type === FUNC_DEC) {
            const { id, params: param_li } = declaration;
            export_li.push([TYPE_FUNCTION, id.name || "", paramStr(param_li)]);
          } else if (dec_type === "VariableDeclaration") {
            for (const { id, init } of declaration.declarations) {
              const name = id.name || "";
              if (init) {
                const { type, params: param_li } = init;
                if (type === ARROW_EXP || type === FUNC_EXP) {
                  export_li.push([TYPE_FUNCTION, name, paramStr(param_li)]);
                  continue;
                }
              }
              export_li.push([TYPE_CONST, name]);
            }
          }
        } else if (specifier_li) {
          for (const { exported, local } of specifier_li) {
            export_li.push([TYPE_EXPORT, exported?.name || local.name || ""]);
          }
        }
      } else if (type === "ExportDefaultDeclaration") {
        if (declaration) {
          const { type: dec_type, params: param_li, name } = declaration;
          if (dec_type === FUNC_DEC || dec_type === ARROW_EXP || dec_type === FUNC_EXP) {
            export_li.push([TYPE_FUNCTION, DEFAULT, paramStr(param_li)]);
          } else if (dec_type === IDENTIFIER) {
            export_li.push([TYPE_CONST, DEFAULT + " (" + name + ")"]);
          } else {
            export_li.push([TYPE_CONST, DEFAULT]);
          }
        }
      }
    }
  }
  return export_li;
};
