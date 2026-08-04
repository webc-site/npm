/*
CSV 解码
str: CSV 单行字符串
返回值: 一维数组
*/
export default (str) => {
  if (!str) return [];
  const row = [],
    len = str.length;
  let i = 0;
  while (i < len) {
    const code = str.charCodeAt(i);
    let next_i, val;
    if (code === 34) {
      let j = i + 1;
      while (j < len) {
        if (str.charCodeAt(j) === 34) {
          if (str.charCodeAt(j + 1) === 34) {
            j += 2;
          } else {
            break;
          }
        } else {
          ++j;
        }
      }
      val = str.slice(i + 1, j).replaceAll('""', '"');
      next_i = j + 1;
    } else {
      let j = i;
      while (j < len) {
        const c = str.charCodeAt(j);
        if (c === 44 || c === 10 || c === 13) break;
        ++j;
      }
      val = str.slice(i, j);
      next_i = j;
    }
    row.push(val);
    const c = str.charCodeAt(next_i);
    if (c === 44) {
      i = next_i + 1;
    } else if (c === 10 || c === 13) {
      break;
    } else {
      i = next_i;
    }
  }
  if (len > 0 && str.charCodeAt(len - 1) === 44) {
    row.push("");
  }
  return row;
};
