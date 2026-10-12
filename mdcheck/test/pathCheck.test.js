import { join } from "node:path";
import pathCheck from "../src/pathCheck.js";
import { run } from "./check.js";

const dir = import.meta.dirname,
  cases = [
    ["valid.md", true, [], "合法文件"],
    ["invalid.md", false, [9], "非法文件"],
    ["multiple.md", false, [15], "多重非法"],
    ["no_mermaid.md", true, [], "无 mermaid"]
  ];

run(pathCheck, cases, (name) => join(dir, "md", name));
