import { all } from "known-css-properties";
import { NODE_IMPORT, NODE_VAR, NODE_PROP, NODE_RULE } from "./const.js";

const CHAR_LF = 10 /* 换行符 \n */,
  CHAR_CR = 13 /* 回车符 \r */,
  CHAR_ASTERISK = 42 /* 星号 * */,
  CHAR_SLASH = 47 /* 斜杠 / */,
  CHAR_BACKSLASH = 92 /* 反斜杠 \ */,
  CHAR_DQUOTE = 34 /* 双引号 " */,
  CHAR_SQUOTE = 39 /* 单引号 ' */,
  CHAR_BQUOTE = 96 /* 反引号 ` */,
  CHAR_U_LOWER = 117 /* 字符 u */,
  CHAR_U_UPPER = 85 /* 字符 U */,
  CHAR_R_LOWER = 114 /* 字符 r */,
  CHAR_R_UPPER = 82 /* 字符 R */,
  CHAR_L_LOWER = 108 /* 字符 l */,
  CHAR_L_UPPER = 76 /* 字符 L */,
  CHAR_LPAREN = 40 /* 左圆括号 ( */,
  CHAR_RPAREN = 41 /* 右圆括号 ) */,
  CHAR_LBRACE = 123 /* 左花括号 { */,
  CSS_PROPERTIES = new Set(all),
  splitAt = (str, idx) => [str.slice(0, idx).trim(), str.slice(idx + 1).trim()],
  extractProp = (trimmed) => {
    const colon_idx = trimmed.indexOf(":");
    if (colon_idx > 0) {
      const [left, right] = splitAt(trimmed, colon_idx);
      if (/^[a-zA-Z-][a-zA-Z0-9-]*$/.test(left)) {
        if (!(CSS_PROPERTIES.has(left) || left.startsWith("--") || left.startsWith("-"))) {
          return [false, "", ""];
        }
        if (right.length > 0 && !right.startsWith("{")) {
          return [true, left, right.endsWith(";") ? right.slice(0, -1).trim() : right];
        }
      }
    }
    const space_idx = trimmed.search(/\s+/);
    if (space_idx > 0) {
      const [left, right] = splitAt(trimmed, space_idx);
      if (CSS_PROPERTIES.has(left) || left.startsWith("--") || left.startsWith("-")) {
        return [true, left, right];
      }
    }
    return [false, "", ""];
  },
  stripCommentsAndCheckBraces = (str) => {
    const parts = [],
      len = str.length;
    let start = 0,
      i = 0,
      in_string = false,
      quote_code = 0,
      in_url = false,
      in_single_comment = false,
      in_multi_comment = false,
      has_brace = false;

    while (i < len) {
      const code = str.charCodeAt(i);

      if (in_single_comment) {
        if (code === CHAR_LF || code === CHAR_CR) {
          in_single_comment = false;
          parts.push(code === CHAR_LF ? "\n" : "\r");
          start = i + 1;
        }
        ++i;
        continue;
      }
      if (in_multi_comment) {
        if (code === CHAR_ASTERISK && i + 1 < len && str.charCodeAt(i + 1) === CHAR_SLASH) {
          in_multi_comment = false;
          start = i + 2;
          i += 2;
        } else {
          if (code === CHAR_LF || code === CHAR_CR) {
            parts.push(code === CHAR_LF ? "\n" : "\r");
          }
          ++i;
        }
        continue;
      }
      if (in_string) {
        if (code === CHAR_BACKSLASH) {
          i += 2;
        } else {
          if (code === quote_code) {
            in_string = false;
          }
          ++i;
        }
        continue;
      }
      if (in_url) {
        if (code === CHAR_RPAREN) {
          in_url = false;
        }
        ++i;
        continue;
      }
      if (code === CHAR_DQUOTE || code === CHAR_SQUOTE || code === CHAR_BQUOTE) {
        in_string = true;
        quote_code = code;
        ++i;
        continue;
      }
      if (code === CHAR_U_LOWER || code === CHAR_U_UPPER) {
        if (
          i + 3 < len &&
          (str.charCodeAt(i + 1) === CHAR_R_LOWER || str.charCodeAt(i + 1) === CHAR_R_UPPER) &&
          (str.charCodeAt(i + 2) === CHAR_L_LOWER || str.charCodeAt(i + 2) === CHAR_L_UPPER) &&
          str.charCodeAt(i + 3) === CHAR_LPAREN
        ) {
          in_url = true;
          i += 4;
          continue;
        }
      }
      if (code === CHAR_SLASH && i + 1 < len) {
        const next_code = str.charCodeAt(i + 1);
        if (next_code === CHAR_SLASH) {
          if (i > start) {
            parts.push(str.slice(start, i));
          }
          in_single_comment = true;
          i += 2;
          continue;
        }
        if (next_code === CHAR_ASTERISK) {
          if (i > start) {
            parts.push(str.slice(start, i));
          }
          in_multi_comment = true;
          i += 2;
          continue;
        }
      }
      if (code === CHAR_LBRACE) {
        has_brace = true;
      }
      ++i;
    }
    if (!in_single_comment && !in_multi_comment && len > start) {
      parts.push(str.slice(start));
    }
    return [parts.join(""), has_brace];
  },
  parseStatement = (trimmed, parent, line_num, file_path, include_prop = false) => {
    if (trimmed.startsWith("@import") || trimmed.startsWith("@require")) {
      const match =
        trimmed.match(/@(import|require)\s+['"]([^'"]+)['"]/) ||
        trimmed.match(/@(import|require)\s+(url\([^)]+\))/);
      if (match) {
        parent[2].push([NODE_IMPORT, match[2], line_num, file_path]);
      }
      return true;
    }
    const var_match = trimmed.match(/^([a-zA-Z_-][a-zA-Z0-9_-]*)\s*=\s*(.*)$/);
    if (var_match) {
      parent[2].push([NODE_VAR, var_match[1].trim(), var_match[2].trim(), line_num, file_path]);
      return true;
    }
    if (include_prop) {
      const [is_prop, name, val] = extractProp(trimmed);
      if (is_prop) {
        parent[2].push([NODE_PROP, name, val, line_num, file_path]);
        return true;
      }
    }
    return false;
  },
  parseCss = (content, file_path) => {
    const root = [NODE_RULE, "", [], 1, file_path],
      stack = [root];

    let current = "",
      current_line = 1,
      i = 0;

    while (i < content.length) {
      const char = content[i];

      if (char === "\n") {
        const trimmed = current.trim();
        if (parseStatement(trimmed, stack[stack.length - 1], current_line, file_path)) {
          current = "";
        }
        current += char;
        ++current_line;
        ++i;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        const quote = char;
        current += char;
        ++i;
        while (i < content.length) {
          const c = content[i];
          if (c === "\n") {
            ++current_line;
          }
          if (c === "\\") {
            current += c + (content[i + 1] || "");
            if (content[i + 1] === "\n") {
              ++current_line;
            }
            i += 2;
          } else if (c === quote) {
            current += c;
            ++i;
            break;
          } else {
            current += c;
            ++i;
          }
        }
        continue;
      }

      if (char === "{") {
        const sel = current.replace(/\s+/g, " ").trim(),
          node = [NODE_RULE, sel, [], current_line, file_path],
          parent = stack[stack.length - 1];
        parent[2].push(node);
        stack.push(node);
        current = "";
        ++i;
        continue;
      }

      if (char === "}") {
        const trimmed = current.trim();
        if (trimmed) {
          parseStatement(trimmed, stack[stack.length - 1], current_line, file_path, true);
        }
        if (stack.length > 1) {
          stack.pop();
        }
        current = "";
        ++i;
        continue;
      }

      if (char === ";") {
        const trimmed = current.trim();
        if (trimmed) {
          parseStatement(trimmed, stack[stack.length - 1], current_line, file_path, true);
        }
        current = "";
        ++i;
        continue;
      }

      current += char;
      ++i;
    }

    return root;
  };

/*
解析 Stylus/CSS 内容为 AST 树

content: Stylus 或 CSS 文本内容
file_path: 当前解析的文件路径

返回: 根节点 [NODE_RULE, "", 子节点列表, 1, file_path]
*/
export default (content, file_path) => {
  const [clean_content, has_brace] = stripCommentsAndCheckBraces(content);

  if (has_brace) {
    return parseCss(clean_content, file_path);
  }

  const lines = clean_content.split(/\r?\n/),
    root = [NODE_RULE, "", [], 1, file_path],
    stack = [[root, -1]];

  lines.forEach((line, idx) => {
    const line_num = idx + 1,
      trimmed = line.trim();
    if (trimmed === "") {
      return;
    }

    const indent = line.match(/^([ \t]*)/)[0].length;

    while (stack.length > 1 && stack[stack.length - 1][1] >= indent) {
      stack.pop();
    }

    const [parent] = stack[stack.length - 1];

    if (parseStatement(trimmed, parent, line_num, file_path, true)) {
      return;
    }

    const node = [NODE_RULE, trimmed, [], line_num, file_path];
    parent[2].push(node);
    stack.push([node, indent]);
  });

  return root;
};
