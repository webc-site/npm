import { relative } from "node:path";
import { parse } from "proto-parser";
import findType from "./findType.js";

const BASE_TYPE = "BaseType",
  relPaths = (prefix_li) => {
    const rel = prefix_li.length ? "../".repeat(prefix_li.length) : "./",
      prefix_dir = rel + prefix_li.join("/"),
      relPath = (name) => {
        const r = relative(prefix_dir, rel + name);
        return r.startsWith(".") ? r : "./" + r;
      };
    return [
      relPath,
      (name_li) => relPath(name_li.join("/")),
      (name) => relPath(name.replaceAll("$", "/"))
    ];
  },
  getTypeStr = (proto_import, type, repeated) => {
    if (repeated) {
      if (["string", "bytes"].includes(type)) {
        proto_import.add(type);
        return "[" + type + "]";
      }
      type += "Li";
    }
    proto_import.add(type);
    return type;
  },
  resolveType = (find, proto_import, js_import, type, repeated) => {
    const { syntaxType, value } = type;
    if (syntaxType === BASE_TYPE) {
      return getTypeStr(proto_import, value, repeated);
    }
    if (syntaxType === "Identifier") {
      const found = find(type);
      if (found) {
        const found_syntax_type = found[1].syntaxType;
        if (found_syntax_type === "EnumDefinition") {
          const val = "int32" + (repeated ? "Li" : "");
          proto_import.add(val);
          return val;
        }
        if (found_syntax_type === "MessageDefinition") {
          const name = found[0].join("$");
          js_import.add(name);
          return repeated ? "[" + name + "]" : name;
        }
      }
    }
  },
  genService = (val, prefix_name, relPathLi, funcId, find) => {
    const code_li = [],
      proto_import = new Set(),
      protoImportAdd = (suffix, type_li) => {
        const type_name = type_li.join("$");
        proto_import.add(type_name + suffix + ' from "' + relPathLi(type_li) + suffix + '.js"');
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
      return [
        prefix_name,
        ['$ from "@1-/proto/rpc.js"', ...proto_import]
          .toSorted()
          .map((i) => "import " + i)
          .join("\n") +
          "\nexport const _=undefined,\n" +
          code_li.join(",\n")
      ];
    }
  },
  genEnum = (val, prefix_name) => {
    const t = Object.entries(val.values).map(([k, v]) => k + " = " + v);
    if (t.length) {
      return [prefix_name, "export const " + t.join(",\n  ")];
    }
  },
  genMessage = (val, prefix_name, relPath$, find, exist) => {
    const proto_import = new Set(),
      js_import = new Set(),
      args = [];

    Object.values(val.fields).forEach((o) => {
      const { id, map, name, repeated } = o,
        type = resolveType(find, proto_import, js_import, o.type, repeated),
        args_type = map
          ? (proto_import.add("map"),
            "map(" + resolveType(find, proto_import, js_import, o.keyType) + "," + type + ")")
          : type;
      args[id - 1] = [id + " " + name, args_type];
    });

    const kind_key = args.map((i) => (i ? i[1] : "")).join(","),
      rename = exist.get(kind_key);

    if (rename) {
      const comment_str =
        "/*\n" +
        args
          .map((args_i, i) =>
            args_i ? "  " + args_i[0] + " " + args_i[1].replaceAll("$", "/") : "  " + (1 + i) + " _"
          )
          .join("\n") +
        "\n*/\n";
      return ["E", "D"].map((kind) => [
        prefix_name + kind,
        comment_str + 'export { default } from "' + relPath$(rename) + kind + '.js"'
      ]);
    }

    exist.set(kind_key, prefix_name);
    const proto_import_str = proto_import.size
        ? ", " + [...proto_import].toSorted().join(", ")
        : "",
      args_str = args.length
        ? "\n  " + args.map((i) => (i ? "/* " + i[0] + " */ " + i[1] : "")).join(",\n  ") + "\n"
        : "",
      js_import_li = [...js_import].toSorted();

    return ["E", "D"].map((kind) => {
      const imp = js_import_li
        .map((i) => "import " + i + ' from "' + relPath$(i) + kind + '.js"')
        .join("\n");
      return [
        prefix_name + kind,
        "import { $ as $" +
          kind +
          proto_import_str +
          ' } from "@1-/proto/' +
          kind +
          '.js"\n' +
          (imp ? imp + "\n" : "") +
          "export default $" +
          kind +
          "([" +
          args_str +
          "])"
      ];
    });
  },
  gen = (funcId, find, root_nested, prefix_li, pkg_li, exist) => {
    const path_code = [];
    if (!root_nested) return path_code;

    const addJs = path_code.push.bind(path_code),
      [relPath, relPathLi, relPath$] = relPaths(prefix_li);

    for (const val of Object.values(root_nested)) {
      const { name, syntaxType } = val,
        prefix_name_li = [...prefix_li, name],
        prefix_pkg = prefix_name_li.join(".") + ".",
        not_pkg = pkg_li.every((pkg) => !pkg.startsWith(prefix_pkg)),
        prefix_name = prefix_name_li.join("/");

      switch (syntaxType) {
        case "ServiceDefinition": {
          const r = genService(val, prefix_name, relPathLi, funcId, find);
          if (r) addJs(r);
          break;
        }
        case "EnumDefinition": {
          const r = genEnum(val, prefix_name);
          if (r) addJs(r);
          break;
        }
        default: {
          if (not_pkg) {
            addJs(...genMessage(val, prefix_name, relPath$, find, exist));
          }
          if (val.nested) {
            addJs(...gen(funcId, find, val.nested, prefix_name_li, pkg_li, new Map()));
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
        .map((line, pos) => 1 + pos + ": " + line)
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
