import mermaidValidate from "./mermaidValidate.js";

export default async (md) => {
  const lines = md.split("\n"),
    blocks = [],
    errors = [];
  let in_mermaid = false,
    start_line = 0,
    current_code = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```mermaid")) {
      in_mermaid = true;
      start_line = i + 2;
      current_code = [];
    } else if (in_mermaid && trimmed === "```") {
      in_mermaid = false;
      blocks.push([start_line, current_code.join("\n")]);
    } else if (in_mermaid) {
      current_code.push(line);
    }
  });

  if (in_mermaid && current_code.length > 0) {
    blocks.push([start_line, current_code.join("\n")]);
  }

  for (const [start, code] of blocks) {
    const errs = await mermaidValidate(code);
    errs.forEach(([rel_line, msg]) => {
      errors.push([start + rel_line - 1, msg]);
    });
  }

  return errors;
};
