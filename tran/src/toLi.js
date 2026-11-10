import CODE from "@3-/lang/CODE.js";

export default (to_li_raw) => {
  if (to_li_raw === "*") {
    return CODE;
  }
  const li = Array.isArray(to_li_raw) ? to_li_raw : to_li_raw.split(/\s+/);
  return [...new Set(li.filter((x) => CODE.includes(x)))];
};
