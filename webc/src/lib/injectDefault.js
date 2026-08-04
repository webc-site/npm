export default (code, genStatement) => {
  if (code.includes("export default")) {
    return code.replace(
      /export\s+default\s*(?:async\s+)?(?:\(([^)]*)\)|([A-Za-z0-9_]+))\s*=>\s*{/,
      (_m, p1, p2) => {
        const param = (p1 || p2 || "").trim() || "root";
        return "export default async (" + param + ") => { " + genStatement(param);
      }
    );
  }
  return code + "\nexport default async (root) => { " + genStatement("root") + " };\n";
};
