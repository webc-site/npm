const cleanPkgJson = (pkg, next_version) => {
  const cleaned = JSON.parse(JSON.stringify(pkg));
  cleaned.version = next_version;
  for (const key of ["devDependencies", "files", "scripts", "lint-staged"]) {
    delete cleaned[key];
  }
  if (cleaned.exports) {
    cleaned.exports = JSON.parse(JSON.stringify(cleaned.exports).replaceAll("./src/", "./"));
  }
  return cleaned;
};

export default cleanPkgJson;
