import { main } from "knip";
import { createOptions } from "knip/session";
import { join, relative } from "node:path";
import { existsSync } from "node:fs";
import ERR from "@3-/log/ERR.js";

const ISSUE_TYPES = [
  "files",
  "dependencies",
  "devDependencies",
  "optionalPeerDependencies",
  "unlisted",
  "binaries",
  "unresolved",
  "exports",
  "nsExports",
  "types",
  "nsTypes",
  "enumMembers",
  "namespaceMembers",
  "duplicates",
  "catalog",
];

export default async (git_root, pkg_path) => {
  const config_path = ["knip.config.js", "knip.js", "knip.json"]
      .map((name) => join(git_root, name))
      .find(existsSync),
    options = await createOptions({
      config: config_path,
      cwd: git_root,
      workspace: relative(git_root, pkg_path),
    }),
    { issues, counters } = await main(options),
    has_errors = ISSUE_TYPES.some((type) => counters[type] > 0);

  if (has_errors) {
    ERR("Knip 静态检查未通过，检测到以下问题：");
    Object.entries(issues).forEach(([category, file_issues]) => {
      if (!file_issues || Object.keys(file_issues).length === 0) {
        return;
      }

      const category_output = [];
      Object.entries(file_issues).forEach(([file, details]) => {
        const detail_list = Array.isArray(details) ? details : Object.values(details);
        if (detail_list.length === 0) {
          return;
        }
        category_output.push("  文件: " + file);
        detail_list.forEach((detail) => {
          if (detail?.constructor === Object) {
            const { symbol, line, col } = detail,
              symbol_str = symbol ? " - " + symbol : "",
              line_str = line ? ":" + line : "",
              col_str = col ? ":" + col : "";
            category_output.push("    " + symbol_str + " (位置: " + line_str + col_str + ")");
          } else {
            category_output.push("    " + detail);
          }
        });
      });

      if (category_output.length > 0) {
        ERR("\n[" + category.toUpperCase() + "]");
        category_output.forEach((line) => ERR(line));
      }
    });
    process.exit(1);
  }
};
