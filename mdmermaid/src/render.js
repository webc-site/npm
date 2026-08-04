if (typeof global === "undefined") {
  globalThis.global = globalThis;
}
if (typeof window !== "undefined") {
  try {
    globalThis.window = globalThis;
  } catch {}
}

export default async (lines, start, end) => {
  const { renderMermaid } = await import("beautiful-mermaid");
  return renderMermaid(lines.slice(start, end - 1).join("\n"));
};
