export default (pkg) => {
  const cleaned = JSON.parse(JSON.stringify(pkg));
  ["devDependencies", "files", "scripts", "lint-staged"].forEach((key) => delete cleaned[key]);
  return cleaned;
};
