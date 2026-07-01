const VAL_MAP = { true: true, false: false, null: null, "~": null },
  IS_NUM = /^-?\d+(\.\d+)?$/,
  skipEol = (text, i) => {
    if (text[i] === "\r") ++i;
    if (text[i] === "\n") ++i;
    return i;
  },
  skipLine = (text, i) => {
    const len = text.length;
    while (i < len && text[i] !== "\r" && text[i] !== "\n") ++i;
    return skipEol(text, i);
  },
  calcIndent = (text, i) => {
    let indent = 0;
    const len = text.length;
    while (i < len && (text[i] === " " || text[i] === "\t")) {
      indent += text[i] === " " ? 1 : 2;
      ++i;
    }
    return [indent, i];
  },
  parse = (str) => {
    if (!str) return "";
    const first = str[0];
    if ((first === '"' || first === "'") && str.endsWith(first)) {
      const inner = str.slice(1, -1);
      return first === '"'
        ? inner.replaceAll("\\n", "\n").replaceAll('\\"', '"').replaceAll("\\\\", "\\")
        : inner;
    }
    return str in VAL_MAP ? VAL_MAP[str] : IS_NUM.test(str) ? +str : str;
  };

/*
解析 YAML 文本为 JS 对象或数组
参数 text: 待解析的文本内容
*/
export default (text) => {
  if (!text) return {};

  const stack = [{ indent: -1, data: {}, key: null }],
    len = text.length;
  let i = 0;

  while (i < len) {
    // 计算缩进
    const [indent, next_i] = calcIndent(text, i);
    i = next_i;

    // 跳过空行
    if (i === len || text[i] === "\r" || text[i] === "\n") {
      i = skipEol(text, i);
      continue;
    }

    // 跳过纯注释行
    if (text[i] === "#") {
      i = skipLine(text, i);
      continue;
    }

    // 处理列表前缀 '-'
    let has_dash = false;
    if (text[i] === "-") {
      const next_c = text[i + 1] || "";
      if (
        next_c === " " ||
        next_c === "\t" ||
        next_c === "\r" ||
        next_c === "\n" ||
        next_c === ""
      ) {
        has_dash = true;
        const [, post_dash_i] = calcIndent(text, i + 1);
        i = post_dash_i;
      }
    }

    // 再次处理可能因 '-' 后面空行/换行导致的空行跳过
    if (i === len || text[i] === "\r" || text[i] === "\n") {
      i = skipEol(text, i);
      continue;
    }

    // 扫描当前行的 Key, Value, 引号, 注释
    const line_start = i;
    let colon_idx = -1,
      comment_idx = -1,
      in_quote = 0; // 0: NO, 1: DOUBLE, 2: SINGLE

    while (i < len) {
      const c = text[i];
      if (c === "\r" || c === "\n") break;

      if (in_quote === 0) {
        if (c === '"') {
          in_quote = 1;
        } else if (c === "'") {
          in_quote = 2;
        } else if (c === "#" && (i === line_start || text[i - 1] === " " || text[i - 1] === "\t")) {
          comment_idx = i;
          break;
        } else if (c === ":" && colon_idx === -1) {
          const next_c = text[i + 1] || "";
          if (
            next_c === " " ||
            next_c === "\t" ||
            next_c === "\r" ||
            next_c === "\n" ||
            next_c === ""
          ) {
            colon_idx = i;
          }
        }
      } else if (in_quote === 1) {
        if (c === "\\") {
          ++i;
        } else if (c === '"') {
          in_quote = 0;
        }
      } else if (in_quote === 2) {
        if (c === "'") {
          in_quote = 0;
        }
      }
      ++i;
    }

    const line_end = comment_idx !== -1 ? comment_idx : i;

    // 推进 i 到当前行尾并跳过换行符
    i = skipLine(text, i);

    // 提取 Key 和 Value
    const has_colon = colon_idx !== -1 && colon_idx < line_end,
      key = has_colon ? text.slice(line_start, colon_idx).trim() : undefined;
    let val = has_colon
      ? text.slice(colon_idx + 1, line_end).trim()
      : text.slice(line_start, line_end).trim();

    // 处理多行块值 '|' 或 '>'
    if (has_colon && (val === "|" || val === ">")) {
      let multiline_indent = 0;
      const multiline_lines = [];

      while (i < len) {
        const [m_indent, k] = calcIndent(text, i);

        if (k === len || text[k] === "\r" || text[k] === "\n") {
          multiline_lines.push("");
          i = skipEol(text, k);
          continue;
        }

        if (multiline_indent === 0) {
          multiline_indent = m_indent;
        }

        if (m_indent >= multiline_indent) {
          let p = k;
          while (p < len && text[p] !== "\r" && text[p] !== "\n") ++p;
          multiline_lines.push(text.slice(i + multiline_indent, p));
          i = skipEol(text, p);
        } else {
          break;
        }
      }
      val = multiline_lines.join("\n") + "\n";
    }

    // 维护缩进栈
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current_frame = stack[stack.length - 1],
      parsed_val = parse(val);

    // 合入解析值
    if (has_dash) {
      const parent_frame = stack[stack.length - 2];
      if (!Array.isArray(current_frame.data)) {
        current_frame.data = [];
        if (parent_frame) {
          parent_frame.data[current_frame.key] = current_frame.data;
        }
      }
      const item = has_colon ? { [key]: parsed_val } : parsed_val;
      current_frame.data.push(item);
      if (has_colon) {
        stack.push({ indent, data: item, key });
      }
    } else if (has_colon) {
      const is_arr = Array.isArray(current_frame.data),
        empty = val === "" || val === undefined,
        item = empty ? {} : is_arr ? { [key]: parsed_val } : parsed_val;

      if (is_arr) {
        current_frame.data.push(item);
      } else {
        current_frame.data[key] = item;
      }
      stack.push({ indent, data: empty ? item : current_frame.data, key });
    }
  }

  return stack[0].data;
};
