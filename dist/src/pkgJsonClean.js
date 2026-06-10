import srcReplace from "./srcReplace.js";

export default (pkg, next_version) => {
  const cleaned = JSON.parse(JSON.stringify(pkg));
  cleaned.version = next_version;
  ["devDependencies", "files", "scripts", "lint-staged"].forEach((key) => delete cleaned[key]);
  ["exports", "bin", "files", "main", "module", "types"].forEach((key) => {
    if (cleaned[key]) {
      cleaned[key] = srcReplace(cleaned[key]);
    }
  });
  return cleaned;
};
