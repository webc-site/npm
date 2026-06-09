import BT3 from "./const/BT3.js";

export default (li) => {
  const blocks = [];
  let in_block = false;
  let type = "";
  let start_line = 0;

  li.forEach((line, i) => {
    const trimmed = line.trim();
    if (!in_block) {
      if (trimmed.startsWith(BT3)) {
        const lang = trimmed.slice(BT3.length).trim();
        if (lang) {
          in_block = true;
          type = lang;
          start_line = i + 1;
        }
      }
    } else {
      if (trimmed === BT3) {
        in_block = false;
        blocks.push([type, start_line, i + 1]);
      }
    }
  });

  if (in_block) {
    blocks.push([type, start_line, li.length + 1]);
  }

  return blocks;
};
