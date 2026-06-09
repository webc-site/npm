import mermaidValidate from "./mermaidValidate.js";
import codeExtract from "@1-/md/code.js";

export default async (md) => {
  const lines = md.split("\n"),
    errors = [],
    blocks = codeExtract(lines)
      .filter(([type]) => type === "mermaid")
      .map(([_, start, end]) => {
        const code = lines.slice(start, end - 1).join("\n");
        return [start + 1, code];
      });

  for (const [start, code] of blocks) {
    const errs = await mermaidValidate(code);
    errs.forEach(([rel_line, msg]) => {
      errors.push([start + rel_line - 1, msg]);
    });
  }

  return errors;
};
