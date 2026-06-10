const srcReplace = (val) => {
  if (val?.constructor === String) {
    return val.replaceAll("./src/", "./");
  }
  if (val?.constructor === Array) {
    return val.map(srcReplace);
  }
  return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, srcReplace(v)]));
};

export default srcReplace;
