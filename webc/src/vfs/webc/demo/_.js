import { existsSync } from "node:fs";
import { join } from "node:path";
import demoCTranSet from "../../../lib/demoCTranSet.js";

export default (code, dir) => {
  if (existsSync(join(dir, "demo", "i18n"))) {
    return demoCTranSet(code);
  }
  return code;
};
