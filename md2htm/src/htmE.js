const MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};

export default (str) => (str ? str.replace(/[&<>"]/g, (c) => MAP[c]) : "");
