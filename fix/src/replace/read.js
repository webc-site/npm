import readReplace from "../lib/readReplace.js";

export default readReplace("readFileSync", "@3-/read", 'import read from "@3-/read";\n', [
  "fs",
  "node:fs",
]);
