import mdCheck from "../src/mdCheck.js";
import { run } from "./check.js";

const cases = [
  ["# Test 1\n\n```mermaid\nflowchart TD\n  A --> B\n```", true, [], "合法 md"],
  ["# Test 2\n\n```mermaid\ngraph TD\n  A --> B\n  C & D E\n```", false, [6], "非法 md"],
  [
    "# Test 3\n\n```mermaid\nflowchart TD\n  A --> B\n```\n\n```mermaid\ngraph TD\n  A --> B\n  C & D E\n```",
    false,
    [11],
    "多区块非法",
  ],
  ["# Test 4\r\n\r\n```mermaid \r\nflowchart TD\r\n  A --> B\r\n```", true, [], "回车换行"],
];

run(mdCheck, cases);
