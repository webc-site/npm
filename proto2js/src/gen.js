import { parse } from "proto-parser";
import { relative } from "node:path";
import findType from "./findType.js";

const BASE_TYPE = "BaseType",
  gen = (funcId, find, root_nested, prefix_li, pkg_li, exist) => {
    const path_code = [];
    if (!root_nested) return path_code;

    const addJs = path_code.push.bind(path_code),
      rel = prefix_li.length ? "../".repeat(prefix_li.length) : "./",
      prefix_dir = rel + prefix_li.join("/"),
      relPath = (name) => {
        const r = relative(prefix_dir, rel + name);
        return r.startsWith(".") ? r : "./" + r;
      },
      relPathLi = (name_li) => relPath(name_li.join("/")),
      relPath$ = (name) => relPath(name.replaceAll("$", "/"));

    for (const val of Object.values(root_nested)) {
      const { name, syntaxType } = val;

      let prefix_name = prefix_li.concat([name]);
      const prefix_pkg = prefix_name.join(".") + ".",
        not_pkg = pkg_li.every((pkg) => !pkg.startsWith(prefix_pkg));
      prefix_name = prefix_name.join("/");

      switch (syntaxType) {
        case "ServiceDefinition": {
          const code_li = [],
            proto_import = new Set(),
            protoImportAdd = (suffix, type_li) => {
              const type_name = type_li.join("$");
              proto_import.add(
                type_name + suffix + ' from "' + relPathLi(type_li) + suffix + '.js"'
              );
              return type_name + suffix;
            };

          Object.entries(val.methods).forEach(([method, { requestType, responseType }]) => {
            [requestType] = find(requestType);
            [responseType] = find(responseType);

            code_li.push(
              method +
                " = $(" +
                funcId(method) +
                "," +
                protoImportAdd("E", requestType) +
                "," +
                protoImportAdd("D", responseType) +
                ")"
            );
          });
          if (code_li.length) {
            addJs([
              prefix_name,
              ['$ from "@1-/proto/rpc.js"', ...proto_import]
                .toSorted()
                .map((i) => "import " + i)
                .join("\n") +
                "\nexport const _=undefined,\n" +
                code_li.join(",\n")
            ]);
          }
          break;
        }
        case "EnumDefinition": {
          const t = Object.entries(val.values).map(([k, v]) => k + " = " + v);
          if (t.length) {
            addJs([prefix_name, "export const " + t.join(",\n  ")]);
          }
          break;
        }
        default: {
          const { fields, nested } = val;
          if (not_pkg) {
            let genJs,
              proto_import = new Set(),
              js_import = new Set(),
              args = [],
              comment = "",
              getType = (type, repeated) => {
                const typeStr = (type) => {
                  if (repeated) {
                    if (["string", "bytes"].includes(type)) {
                      proto_import.add(type);
                      return "[" + type + "]";
                    }
                    type += "Li";
                  }
                  proto_import.add(type);
                  return type;
                };
                let { value, syntaxType } = type;
                if (syntaxType === BASE_TYPE) {
                  return typeStr(value);
                } else if (syntaxType === "Identifier") {
                  const found = find(type);
                  if (found) {
                    const found_syntax_type = found[1].syntaxType;
                    if (found_syntax_type === "EnumDefinition") {
                      comment += " : " + (repeated ? "[enum " + value + "]" : "enum " + value);
                      value = "int32" + (repeated ? "Li" : "");
                      proto_import.add(value);
                      return value;
                    } else if (found_syntax_type === "MessageDefinition") {
                      const name = found[0].join("$");
                      js_import.add(name);
                      return repeated ? "[" + name + "]" : name;
                    }
                  }
                }
              };

            Object.values(fields).forEach((o) => {
              const { id, name, map, repeated } = o,
                type = getType(o.type, repeated),
                args_type = map
                  ? (proto_import.add("map"), "map(" + getType(o.keyType) + "," + type + ")")
                  : type;
              args[id - 1] = [id + " " + name, args_type];
            });

            if (proto_import.size) {
              proto_import = ", " + Array.from(proto_import).toSorted().join(", ");
            } else {
              proto_import = "";
            }

            const kind_key = args.map((i) => (i ? i[1] : "")).join(","),
              rename = exist.get(kind_key);

            if (rename) {
              genJs = (kind) => {
                const comment_str = args
                  .map((args_i, i) =>
                    args_i
                      ? "  " + args_i[0] + " " + args_i[1].replaceAll("$", "/")
                      : "  " + (1 + i) + " _"
                  )
                  .join("\n");
                return (
                  "/*\n" +
                  comment_str +
                  "\n*/\n" +
                  'export { default } from "' +
                  relPath$(rename) +
                  kind +
                  '.js"'
                );
              };
            } else {
              exist.set(kind_key, prefix_name);
              if (args.length) {
                args =
                  "\n  " +
                  args.map((i) => (i ? "/* " + i[0] + " */ " + i[1] : "")).join(",\n  ") +
                  "\n";
              } else {
                args = "";
              }

              js_import = [...js_import].toSorted();
              genJs = (kind) => {
                const imp = js_import
                  .map((i) => "import " + i + ' from "' + relPath$(i) + kind + '.js"')
                  .join("\n");
                return (
                  "import { $ as $" +
                  kind +
                  proto_import +
                  ' } from "@1-/proto/' +
                  kind +
                  '.js"\n' +
                  (imp ? imp + "\n" : "") +
                  "export default $" +
                  kind +
                  "([" +
                  args +
                  "])"
                );
              };
            }
            ["E", "D"].forEach((kind) => {
              addJs([prefix_name + kind, genJs(kind)]);
            });
          }

          if (nested) {
            addJs(...gen(funcId, find, nested, [...prefix_li, name], pkg_li, new Map()));
          }
        }
      }
    }
    return path_code;
  };

export default (proto, pkg_set, funcId) => {
  const parsed = parse(proto);

  if (parsed.error) {
    throw new Error(
      proto
        .split("\n")
        .map((line, pos) => pos + 1 + ": " + line)
        .join("\n") +
        "\nline " +
        parsed.line +
        ": " +
        parsed.message
    );
  }

  const { root } = parsed;
  return gen(funcId, findType(".", root), root.nested, [], [...pkg_set], new Map());
};
