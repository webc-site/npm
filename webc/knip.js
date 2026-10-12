export default {
  entry: [
    "src/bin/*.js",
    "src/fix/*.js",
    "src/vfs/**/*.js",
    "src/dist/*.js",
    "src/cli/*.js",
    "src/lib/*.js"
  ],
  project: ["src/**/*.js"],
  ignoreDependencies: ["@1-/fix"]
};
