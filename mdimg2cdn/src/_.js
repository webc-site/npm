import { readFile } from "node:fs/promises";
import { isAbsolute, join, extname } from "node:path";
import li from "@1-/md/li.js";
import code from "@1-/md/code.js";
import parse from "./parse.js";
import renderMermaid from "@1-/mdmermaid";

/*
检查 url 是否为本地路径
参数: url (待检查字符串)
返回值: 布尔值
*/
const local = (url) => {
    if (!url) {
      return false;
    }
    const low = url.toLowerCase();
    return !(
      low.startsWith("http://") ||
      low.startsWith("https://") ||
      low.startsWith("//") ||
      low.startsWith("data:")
    );
  },
  // 去除 URL 的 query 与 hash 获得干净路径
  clean = (url) => url.split("?")[0].split("#")[0],
  // 检查当前行是否位于 Markdown 代码块内部以跳过解析
  skip = (line_idx, blocks) => {
    const line_num = line_idx + 1;
    return blocks.some(([_, start, end]) => line_num >= start && line_num <= end);
  },
  // 过滤单行内的 ` ` 行内代码块，将其替换为等长的空格以避免误解析
  maskInlineCode = (line) => {
    const chars = line.split("");
    let i = 0;
    const len = chars.length,
      isEscaped = (pos) => {
        let count = 0;
        let idx = pos - 1;
        while (idx >= 0 && chars[idx] === "\\") {
          count++;
          idx--;
        }
        return count % 2 !== 0;
      };

    while (i < len) {
      if (chars[i] === "`" && !isEscaped(i)) {
        const start = i;
        while (i < len && chars[i] === "`") {
          i++;
        }
        const count = i - start;
        let found = false;
        let j = i;
        while (j < len) {
          if (chars[j] === "`" && !isEscaped(j)) {
            const cStart = j;
            while (j < len && chars[j] === "`") {
              j++;
            }
            const cCount = j - cStart;
            if (cCount === count) {
              for (let k = start; k < j; k++) {
                chars[k] = " ";
              }
              found = true;
              i = j;
              break;
            }
          } else {
            j++;
          }
        }
        if (!found) {
          i = start + count;
        }
      } else {
        i++;
      }
    }
    return chars.join("");
  };

/*
将 Markdown 文档中的本地图片上传至 CDN 并替换链接
参数:
  md: Markdown 文本内容
  upload: 上传回调函数 (buf, ext) => Promise<url>
  base_dir: 本地路径解析的基准目录
返回值: 替换后的 Markdown 文本
*/
export default async (md, upload, base_dir) => {
  const mermaidUpload = async (buf, filename) => {
    const ext = filename.split(".").pop(),
      url = await upload(buf, ext);
    return url.startsWith("//") ? "https:" + url : url;
  };
  md = await renderMermaid(md, mermaidUpload);

  const lines = li(md),
    blocks = code(lines),
    local_urls = new Set();

  lines.forEach((line, i) => {
    if (skip(i, blocks)) {
      return;
    }
    for (const [_, __, url] of parse(maskInlineCode(line))) {
      if (local(url)) {
        local_urls.add(url);
      }
    }
  });

  if (local_urls.size === 0) {
    return md;
  }

  const abs_to_cdn = new Map(),
    url_to_cdn = new Map();

  for (const url of local_urls) {
    const clean_url = clean(url),
      abs_path = isAbsolute(clean_url) ? clean_url : join(base_dir, clean_url);

    if (!abs_to_cdn.has(abs_path)) {
      const buf = await readFile(abs_path),
        ext = extname(clean_url).slice(1).toLowerCase() || "png",
        cdn_url = await upload(buf, ext);
      abs_to_cdn.set(abs_path, cdn_url);
    }
    url_to_cdn.set(url, abs_to_cdn.get(abs_path));
  }

  const new_lines = lines.map((line, i) => {
    if (skip(i, blocks)) {
      return line;
    }
    const replace_targets = parse(maskInlineCode(line))
      .filter(([_, __, url]) => url_to_cdn.has(url))
      .sort((a, b) => b[0] - a[0]);

    if (replace_targets.length === 0) {
      return line;
    }

    let new_line = line;
    for (const [start, end, url] of replace_targets) {
      const cdn_url = url_to_cdn.get(url);
      new_line = new_line.slice(0, start) + cdn_url + new_line.slice(end);
    }
    return new_line;
  });

  return new_lines.join("\n");
};
