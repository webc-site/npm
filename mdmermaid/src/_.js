import li from "@1-/md/li.js";
import code from "@1-/md/code.js";
import render from "./render.js";

export default async (md) => {
  const lines = li(md),
    blocks = code(lines);

  for (let i = blocks.length - 1; i >= 0; --i) {
    const [type, start, end] = blocks[i];
    if (type !== "mermaid") continue;

    try {
      const svg = await render(lines, start, end),
        svg_lines = li(svg);
      lines.splice(start - 1, end - start + 1, ...svg_lines);
    } catch (err) {
      const { hash } = err,
        { loc, line } = hash ?? {},
        abs_line = start + (loc?.first_line ?? (line !== undefined ? line + 1 : 1));
      throw [abs_line, lines[abs_line - 1], err];
    }
  }

  return lines.join("\n");
};
