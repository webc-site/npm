#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { join } from "node:path";
import mdimg2cdn from "../src/_.js";

const BASE_DIR = join(import.meta.dirname, "img");

[
  [
    "普通 Markdown 图片",
    "![测试图片](./test.png)",
    "![测试图片](https://cdn.example.com/uploaded.png)",
    ["png"]
  ],
  [
    "HTML img 标签",
    '<img src="test.png" width="100">',
    '<img src="https://cdn.example.com/uploaded.png" width="100">',
    ["png"]
  ],
  [
    "跳过网络图片",
    "![网络](https://example.com/logo.png)\n<img src='//example.com/a.jpg'>",
    "![网络](https://example.com/logo.png)\n<img src='//example.com/a.jpg'>",
    []
  ],
  [
    "跳过代码块",
    "```markdown\n![测试](./test.png)\n```",
    "```markdown\n![测试](./test.png)\n```",
    []
  ],
  [
    "跳过单反引号行内代码",
    "一些文字 `![测试](./test.png)` 更多文字",
    "一些文字 `![测试](./test.png)` 更多文字",
    []
  ],
  [
    "跳过双反引号行内代码",
    "一些文字 ``![测试](./test.png)`` 更多文字",
    "一些文字 ``![测试](./test.png)`` 更多文字",
    []
  ],
  [
    "行内代码外依然处理图片",
    "![测试图片](./test.png) 一些文字 `code` 更多文字",
    "![测试图片](https://cdn.example.com/uploaded.png) 一些文字 `code` 更多文字",
    ["png"]
  ],
  [
    "支持带有 query 参数的本地路径",
    "![带有参数](./test.png?v=123#hash)",
    "![带有参数](https://cdn.example.com/uploaded.png)",
    ["png"]
  ],
  [
    "图片去重，只上传一次",
    "![图片1](./test.png)\n![图片2](test.png)\n<img src='./test.png'>",
    "![图片1](https://cdn.example.com/uploaded.png)\n![图片2](https://cdn.example.com/uploaded.png)\n<img src='https://cdn.example.com/uploaded.png'>",
    ["png"]
  ],
  [
    "一行中包含多个图片",
    "![图1](./test.png) 一些文字 <img src='test.png'>",
    "![图1](https://cdn.example.com/uploaded.png) 一些文字 <img src='https://cdn.example.com/uploaded.png'>",
    ["png"]
  ],
  [
    "Mermaid 渲染替换",
    "```mermaid\ngraph TD\n    A --> B\n```",
    "![](https://cdn.example.com/uploaded.svg)",
    ["svg"]
  ]
].forEach(([name, md, expected, calls]) => {
  test(name, async () => {
    const upload_calls = [],
      mockUpload = async (buf, ext) => {
        upload_calls.push({ buf, ext });
        return "https://cdn.example.com/uploaded." + ext;
      },
      result = await mdimg2cdn(md, mockUpload, BASE_DIR);

    expect(result).toBe(expected);
    expect(upload_calls.length).toBe(calls.length);
    calls.forEach((ext, idx) => {
      expect(upload_calls[idx].ext).toBe(ext);
      if (ext === "svg") {
        expect(upload_calls[idx].buf.toString()).toContain("<svg");
      } else {
        expect(upload_calls[idx].buf.toString().trim()).toBe("fake png content");
      }
    });
  });
});
