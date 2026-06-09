import { renderMermaid } from "beautiful-mermaid";

export default (lines, start, end) => renderMermaid(lines.slice(start, end - 1).join("\n"));
