import li from "@1-/md/li.js";
import code from "@1-/md/code.js";
import ERR from "@3-/log/ERR.js";
import render from "./render.js";
import optSvg from "./optSvg.js";

export default async (md, upload) => {
  const lines = li(md),
    blocks = code(lines),
    has_mermaid = blocks.some(([type]) => type === "mermaid");

  if (!has_mermaid) return md;

  for (let i = blocks.length - 1; i >= 0; --i) {
    const [type, start, end] = blocks[i];
    if (type !== "mermaid") continue;

    const block_lines = lines.slice(start, end - 1);
    let raw_svg;
    try {
      raw_svg = await render(lines, start, end);
    } catch (err) {
      let err_line_offset = 0;
      for (let j = 0; j < block_lines.length; ++j) {
        if (block_lines[j].trim() && err.message.includes(block_lines[j])) {
          err_line_offset = j;
          break;
        }
      }
      throw [start + 1 + err_line_offset, block_lines[err_line_offset], err];
    }

    if (upload) {
      try {
        const opt_svg = optSvg(raw_svg),
          opt_buf = Buffer.from(opt_svg),
          url = await upload(opt_buf, "a.svg");
        lines.splice(start - 1, end - start + 1, "![](" + url + ")");
      } catch (err) {
        ERR("Upload/callback failed:", err);
      }
    } else {
      const svg_lines = li(raw_svg);
      lines.splice(start - 1, end - start + 1, ...svg_lines);
    }
  }

  return lines.join("\n");
};
