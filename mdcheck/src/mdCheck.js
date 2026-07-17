import mermaidCheck from "./mermaidCheck.js";
import codeExtract from "@1-/md/code.js";
import li from "@1-/md/li.js";

export default async (md) => {
  const lines = li(md),
    errors = await Promise.all(
      codeExtract(lines)
        .filter(([type]) => type === "mermaid")
        .map(async ([_, start, end]) => {
          const code = lines.slice(start, end - 1).join("\n"),
            errs = await mermaidCheck(code);
          return errs.map(([rel_line, msg]) => [start + rel_line, msg]);
        })
    );

  return errors.flat();
};
