import { parse } from "yuku-parser";

export const parseI18nKeys = (code) => {
    const key_li = [],
      ast = parse(code),
      body = ast ? ast.program.body : [];
    for (const node of body) {
      if (
        node.type === "ExportNamedDeclaration" &&
        node.declaration &&
        node.declaration.type === "VariableDeclaration"
      ) {
        for (const decl of node.declaration.declarations || []) {
          if (
            decl.id &&
            decl.id.type === "Identifier" &&
            decl.init &&
            decl.init.type === "Literal"
          ) {
            key_li.push({
              name: decl.id.name,
              value: decl.init.value
            });
          }
        }
      }
    }
    return key_li;
  },
  compileI18nKeys = (code) => {
    const key_li = parseI18nKeys(code);
    return {
      key_li,
      code_li: key_li.map((k, index) => "export const " + k.name + " = " + index + ";")
    };
  };
