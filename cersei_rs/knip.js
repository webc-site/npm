export default {
  entry: ["test/*.js", "build.js", "dist.js", "ops/test.js"],
  ignore: ["src/npmOrg.js", "src/log.d.ts", "src/index.js", "src/index.d.ts"],
  ignoreDependencies: ["@3-/log"]
};
