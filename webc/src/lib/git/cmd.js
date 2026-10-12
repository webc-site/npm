import { $ } from "@3-/zx";

export default (cwd) => (cmd) => $({ cwd })(["git -c advice.detachedHead=false " + cmd]);
