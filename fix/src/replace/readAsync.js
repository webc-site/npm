import readReplace from "../lib/readReplace.js";

export default readReplace("readFile", "@1-/read", 'import read from "@1-/read";\n', [
  "fs",
  "node:fs",
  "fs/promises",
  "node:fs/promises"
]);
