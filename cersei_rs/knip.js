export default {
  entry: ["tests/*.js", "./build.js", "./dist.js", "./ops/npmInit.js", "./ops/prepublish.js"],
  ignore: ["src/index.js", "src/index.d.ts"],
};
