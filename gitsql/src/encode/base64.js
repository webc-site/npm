const BASE64URL = "base64url";

export const encode = (val) => Buffer.from(val).toString(BASE64URL),
  decode = (str) => {
    if (str === "") return Buffer.alloc(0);
    return Buffer.from(str, BASE64URL);
  };
