import mermaidCheck from "../src/mermaidCheck.js";
import { run } from "./check.js";

const cases = [
  ["flowchart TD\n  A --> B", true, [], "合法 mermaid"],
  ["graph TD\n  A --> B\n  C & D E", false, [3], "非法 mermaid"],
];

run(mermaidCheck, cases);
