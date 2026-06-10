const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

export default (val) => {
  let res = "x'";
  const len = val.length;
  for (let i = 0; i < len; ++i) {
    res += HEX[val[i]];
  }
  return res + "'";
};
