export const concat = (...arrays) => {
    const res = new Uint8Array(arrays.reduce((acc, cur) => acc + cur.length, 0));
    let pos = 0;
    for (const arr of arrays) {
      res.set(arr, pos);
      pos += arr.length;
    }
    return res;
  },
  write = (val) => {
    if (!val) {
      return new Uint8Array(0);
    }
    const buf = new Uint8Array(8);
    new DataView(buf.buffer).setBigUint64(0, BigInt(val), true);
    let len = 8;
    while (len > 0 && buf[len - 1] === 0) {
      --len;
    }
    return buf.subarray(0, len);
  },
  read = (buf) => {
    if (!buf || buf.length === 0) {
      return 0;
    }
    const padded = new Uint8Array(8);
    padded.set(buf);
    return Number(new DataView(padded.buffer).getBigUint64(0, true));
  };
