import { createHash } from "crypto";

export default (buf) => createHash("sha3-256").update(buf).digest("base64url");
