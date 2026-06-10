export default {
  entry: ["tests/*.js", "./build.js", "./dist.js", "./ops/test.js"],
  ignore: ["src/index.js", "src/index.d.ts", "src/npmOrg.js", "src/log.d.ts", "src/MSG.d.ts"],
  ignoreDependencies: ["@3-/log"],
};
