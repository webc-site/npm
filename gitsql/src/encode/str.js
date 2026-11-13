export default (val) => {
  let res = "'";
  const len = val.length;
  for (let i = 0; i < len; ++i) {
    if (val.charCodeAt(i) === 39) {
      res += "''";
    } else {
      res += val[i];
    }
  }
  return res + "'";
};
