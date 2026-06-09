import { main } from "knip";
import { createOptions } from "knip/session";
import path from "node:path";
import ROOT from "../ROOT.js";
import ERR from "@3-/log/ERR.js";

const issueTypes = [
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

export default async () => {
  const configPath = path.join(ROOT, "knip.config.js"),
    options = await createOptions({
      config: configPath,
      cwd: ROOT,
    }),
    { issues, counters } = await main(options);

  let hasErrors = false;
  for (const type of issueTypes) {
    if (counters[type] > 0) {
      hasErrors = true;
      break;
    }
  }

  if (hasErrors) {
    ERR("Knip 静态检查未通过，检测到以下问题：");
    for (const [category, fileIssues] of Object.entries(issues)) {
      if (!fileIssues || Object.keys(fileIssues).length === 0) continue;

      const categoryOutput = [];
      for (const [file, details] of Object.entries(fileIssues)) {
        const detailList = Array.isArray(details) ? details : Object.values(details);
        if (detailList.length === 0) continue;
        categoryOutput.push(`  文件: ${file}`);
        for (const detail of detailList) {
          if (detail && typeof detail === "object") {
            const symbol = detail.symbol ? ` - ${detail.symbol}` : "",
              line = detail.line ? `:${detail.line}` : "",
              col = detail.col ? `:${detail.col}` : "";
            categoryOutput.push(`    ${symbol} (位置: ${line}${col})`);
          } else {
            categoryOutput.push(`    ${detail}`);
          }
        }
      }

      if (categoryOutput.length > 0) {
        console.error(`\n[${category.toUpperCase()}]`);
        for (const line of categoryOutput) {
          console.error(line);
        }
      }
    }
    process.exit(1);
  }
};
