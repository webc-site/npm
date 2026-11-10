import { createHash } from "node:crypto";

export default (buf) =>
  buf.length <= 16 ? buf : new Uint8Array(createHash("md5").update(buf).digest());
