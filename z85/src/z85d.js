import CHARS from "./_.js";

const DECODE_MAP = new Int8Array(256).fill(-1),
  DECODE_MAP_2 = new Int16Array(65536).fill(-1);

CHARS.map((cx, x) => {
  DECODE_MAP[cx] = x;
  CHARS.map((cy, y) => (DECODE_MAP_2[(cx << 8) | cy] = x * 85 + y));
});

export default (bytes) => {
  if (!(bytes instanceof Uint8Array) || bytes.length % 5) return;
  const len = bytes.length,
    out = new Uint8Array((len / 5) * 4);
  for (let i = 0, j = 0; i < len; i += 5, j += 4) {
    const val_part_1 = DECODE_MAP_2[(bytes[i] << 8) | bytes[i + 1]],
      val_part_2 = DECODE_MAP_2[(bytes[i + 2] << 8) | bytes[i + 3]],
      val_part_3 = DECODE_MAP[bytes[i + 4]];
    if ((val_part_1 | val_part_2 | val_part_3) < 0) return;
    const val = (val_part_1 * 7225 + val_part_2) * 85 + val_part_3;
    if (val > 4294967295) return;
    out[j] = val >>> 24;
    out[j + 1] = val >>> 16;
    out[j + 2] = val >>> 8;
    out[j + 3] = val;
  }
  return out;
};
