import { createHash } from "node:crypto";
import utf8e from "@3-/utf8/utf8e.js";

export default (str) => {
  const buf = utf8e(str);
  return buf.length <= 16 ? buf : new Uint8Array(createHash("md5").update(buf).digest());
};
