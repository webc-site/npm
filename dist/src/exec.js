import { execSync } from "node:child_process";
import GREEN from "@3-/log/GREEN.js";

export default (cmd, cwd) => {
  GREEN("❯ " + cmd);
  return execSync(cmd, { cwd, stdio: "inherit" });
};
