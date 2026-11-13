const VAL_MAP = Object.assign(Object.create(null), {
    true: true,
    false: false,
    null: null,
    "~": null
  }),
  IS_NUM = /^-?\d+(\.\d+)?$/,
  NO_QUOTE = 0,
  DOUBLE_QUOTE = 1,
  SINGLE_QUOTE = 2,
  skip = (text, i) => {
    if (text[i] === "\r") ++i;
    if (text[i] === "\n") ++i;
    return i;
  },
  next = (text, i) => {
    const len = text.length;
    while (i < len && !"\r\n".includes(text[i])) ++i;
    return skip(text, i);
  },
  calc = (text, i) => {
    const len = text.length;
    let indent = 0;
    while (i < len && " \t".includes(text[i])) {
      indent += text[i] === " " ? 1 : 2;
      ++i;
    }
    return [indent, i];
  },
  unquote = (str) => {
    if (!str) return "";
    const first = str[0];
    if ((first === '"' || first === "'") && str.endsWith(first)) {
      return first === '"'
        ? str.slice(1, -1).replaceAll("\\n", "\n").replaceAll('\\"', '"').replaceAll("\\\\", "\\")
        : str.slice(1, -1);
    }
    return str;
  },
  parse = (str) => {
    if (!str) return "";
    const s = unquote(str);
    if (s !== str) return s;
    const val = VAL_MAP[str];
    return val !== undefined ? val : IS_NUM.test(str) ? +str : str;
  },
  set = (obj, key, val) => {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, {
        value: val,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = val;
    }
  },
  read = (text, i, len, type, chomping, parent_indent) => {
    let indent = 0;
    const line_li = [],
      pending_li = [];
    while (i < len) {
      const [m_indent, k] = calc(text, i);
      if (k === len || "\r\n".includes(text[k])) {
        pending_li.push("");
        i = skip(text, k);
        continue;
      }
      if (indent === 0) {
        if (m_indent <= parent_indent) {
          break;
        }
        indent = m_indent;
      }
      if (m_indent >= indent) {
        for (const _ of pending_li) {
          line_li.push({ text: "", indent: 0, is_empty: true });
        }
        pending_li.length = 0;
        let p = k;
        while (p < len && !"\r\n".includes(text[p])) ++p;
        line_li.push({ text: text.slice(i + indent, p), indent: m_indent, is_empty: false });
        i = skip(text, p);
      } else {
        break;
      }
    }
    const res_li = [];
    if (type === ">") {
      for (let idx = 0; idx < line_li.length; ++idx) {
        const { text: line_text, indent: line_indent, is_empty } = line_li[idx];
        if (
          idx > 0 &&
          !is_empty &&
          line_indent === indent &&
          !line_li[idx - 1].is_empty &&
          line_li[idx - 1].indent === indent
        ) {
          res_li[res_li.length - 1] += " " + line_text;
        } else {
          res_li.push(line_text);
        }
      }
    } else {
      for (const line of line_li) res_li.push(line.text);
    }
    const val =
      chomping === "-"
        ? res_li.join("\n")
        : chomping === "+"
          ? res_li.concat(pending_li).join("\n") + "\n"
          : res_li.join("\n") + "\n";
    return [val, i];
  };

export default (text) => {
  if (!text) return {};

  const stack_li = [{ indent: -1, data: {}, key: null }],
    len = text.length;
  let i = 0,
    prev_indent = Infinity,
    prev_item_parent = null,
    prev_item_key = null,
    prev_val = null;

  while (i < len) {
    const [indent, next_i] = calc(text, i);
    i = next_i;

    if (i === len || "\r\n".includes(text[i])) {
      i = skip(text, i);
      continue;
    }

    if (text[i] === "#") {
      i = next(text, i);
      continue;
    }

    const has_dash = text[i] === "-" && (!text[i + 1] || " \t\r\n".includes(text[i + 1]));
    if (has_dash) {
      i = calc(text, i + 1)[1];
    }

    if (i === len || "\r\n".includes(text[i])) {
      i = skip(text, i);
      continue;
    }

    const line_start = i;
    let colon_idx = -1,
      comment_idx = -1,
      in_quote = NO_QUOTE;

    while (i < len) {
      const c = text[i];
      if ("\r\n".includes(c)) break;

      if (in_quote === NO_QUOTE) {
        if (c === '"') {
          in_quote = DOUBLE_QUOTE;
        } else if (c === "'") {
          in_quote = SINGLE_QUOTE;
        } else if (c === "#" && (i === line_start || " \t".includes(text[i - 1]))) {
          comment_idx = i;
          break;
        } else if (c === ":" && colon_idx === -1) {
          const next_c = text[i + 1];
          if (!next_c || " \t\r\n".includes(next_c)) {
            colon_idx = i;
          }
        }
      } else if (in_quote === DOUBLE_QUOTE) {
        if (c === "\\") {
          ++i;
        } else if (c === '"') {
          in_quote = NO_QUOTE;
        }
      } else if (in_quote === SINGLE_QUOTE) {
        if (c === "'") {
          in_quote = NO_QUOTE;
        }
      }
      ++i;
    }

    const line_end = comment_idx !== -1 ? comment_idx : i;
    i = next(text, i);

    const has_colon = colon_idx !== -1 && colon_idx < line_end,
      key = has_colon ? unquote(text.slice(line_start, colon_idx).trim()) : undefined;
    let val = has_colon
      ? text.slice(colon_idx + 1, line_end).trim()
      : text.slice(line_start, line_end).trim();

    const match = has_colon && /^(?<type>[|>])(?<chomping>[+-]?)$/.exec(val),
      is_multiline = !!match;
    if (is_multiline) {
      const { type, chomping } = match.groups;
      [val, i] = read(text, i, len, type, chomping, indent);
    }

    let last = stack_li.at(-1);

    if (indent > prev_indent && typeof prev_val === "string" && prev_item_parent) {
      const child_li = [],
        new_container = { [prev_val]: child_li };
      prev_item_parent[prev_item_key] = new_container;

      stack_li.push({
        indent: prev_indent,
        data: child_li,
        key: prev_val
      });
      last = stack_li.at(-1);
    }

    while (stack_li.length > 1 && last.indent >= indent) {
      stack_li.pop();
      last = stack_li.at(-1);
    }

    const parsed = parse(val);

    if (has_dash) {
      let { data } = last;
      if (!Array.isArray(data)) {
        data = last.data = [];
        const parent = stack_li.at(-2);
        if (parent) {
          set(parent.data, last.key, data);
        }
      }
      const item = has_colon ? { [key]: parsed } : parsed;
      data.push(item);

      if (!has_colon) {
        prev_indent = indent;
        prev_item_parent = data;
        prev_item_key = data.length - 1;
        prev_val = item;
      } else {
        prev_indent = indent;
        prev_val = null;
      }

      if (has_colon) {
        stack_li.push({ indent, data: item, key });
      }
    } else if (has_colon) {
      const { data } = last,
        is_arr = Array.isArray(data),
        empty = !is_multiline && !val,
        item = empty ? {} : is_arr ? { [key]: parsed } : parsed;

      if (is_arr) {
        data.push(item);
      } else {
        set(data, key, item);
      }

      prev_indent = indent;
      prev_val = null;

      stack_li.push({ indent, data: empty ? item : data, key });
    }
  }

  return stack_li[0].data;
};
