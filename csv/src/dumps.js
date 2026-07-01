import csvE from "./csvE.js";

export default (li) => {
  const len = li.length;
  let res = "";
  if (len) {
    res = csvE(li[0]);
    for (let i = 1; i < len; ++i) {
      res += "\n" + csvE(li[i]);
    }
  }
  return res;
};
