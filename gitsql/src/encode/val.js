import str from "./str.js";
import buf from "./buf.js";

export default (x) => {
  if (x == null) {
    return "NULL";
  }
  if (x instanceof Uint8Array) {
    return buf(x);
  }
  const type = typeof x;
  if (type === "string") {
    return str(x);
  }
  if (type === "number") {
    return String(x);
  }
  if (type === "boolean") {
    return x ? "1" : "0";
  }
  return str(String(x));
};
