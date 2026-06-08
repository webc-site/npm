export default {
  workspaces: {
    ".": {
      entry: ["_/hook/*.js", "_/hook/**/*.test.js", "./dist.js", "./.mdcheck.js"],
      ignoreDependencies: ["oxlint", "lint-staged", "@3-/sleep", "@1-/mdcheck"],
    },
    "*": {
      entry: ["tests/*.js"],
    },
  },
  ignoreDependencies: [],
  ignore: [],
};
