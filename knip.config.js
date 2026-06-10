import cersei_rs from "./cersei_rs/knip.js";

export default {
  workspaces: {
    ".": {
      entry: ["_/hook/*.js", "./.mdcheck.js", "_/rs/*.js"],
      ignoreDependencies: ["oxlint", "lint-staged", "@3-/sleep", "@1-/mdcheck"],
    },
    str: {
      entry: ["tests/*.js", "bench/*.js"],
    },
    i18n_scan: {
      entry: ["tests/*.js", "example/*.js"],
    },
    cersei_rs,
    "*": {
      entry: ["tests/*.js"],
    },
  },
  ignoreDependencies: [],
  ignoreBinaries: ["fix/src/fix.js", "version"],
  ignore: ["./new.js", "./conf/**", "_/conf/**", "**/knip.js", "_/rs/github_action/**"],
};
