import ENCODE_MAP from "./_.js";

export default (bytes) => {
  if (!(bytes instanceof Uint8Array) || bytes.length % 4) return;
  const len = bytes.length,
    out = new Uint8Array((len / 4) * 5);
  for (let i = 0, j = 0; i < len; i += 4, j += 5) {
    let val = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    out[j + 4] = ENCODE_MAP[val % 85];
    val = (val / 85) | 0;
    out[j + 3] = ENCODE_MAP[val % 85];
    val = (val / 85) | 0;
    out[j + 2] = ENCODE_MAP[val % 85];
    val = (val / 85) | 0;
    out[j + 1] = ENCODE_MAP[val % 85];
    out[j] = ENCODE_MAP[(val / 85) | 0];
  }
  return out;
};
