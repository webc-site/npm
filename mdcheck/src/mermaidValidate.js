let mermaid;

export default async (code) => {
  if (typeof globalThis.window === "undefined") {
    const dom = {
      nodeType: 9,
      createElement: () => ({
        cloneNode: () => ({}),
        remove: () => {},
      }),
      importNode: () => ({}),
    };
    globalThis.window = {
      document: dom,
      DocumentFragment: class {},
      HTMLTemplateElement: class {},
      Node: class {},
      Element: class {},
      NamedNodeMap: class {},
      HTMLFormElement: class {},
      DOMParser: class {},
    };
  }
  if (!mermaid) {
    mermaid = (await import("mermaid")).default;
  }
  try {
    await mermaid.parse(code);
    return [];
  } catch (e) {
    const { hash } = e,
      line = hash?.loc?.first_line ?? (hash?.line !== undefined ? hash.line + 1 : 1),
      msg = e.message ?? "";
    return [[line, msg]];
  }
};
