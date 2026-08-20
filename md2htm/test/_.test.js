#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import md2htm from "../src/_.js";

const CASES = [
  // 基础与空输入
  ["空输入", "", ""],
  ["换行与空格", "   \n\n  ", ""],

  // 标题
  ["一级标题", "# 标题1", "<h1>标题1</h1>"],
  ["二级标题", "## 标题2", "<h2>标题2</h2>"],
  ["六级标题", "###### 标题6", "<h6>标题6</h6>"],

  // 段落与文本格式
  ["普通段落", "测试文本", "<p>测试文本</p>"],
  ["粗体", "**粗体**", "<p><strong>粗体</strong></p>"],
  ["斜体", "*斜体*", "<p><em>斜体</em></p>"],
  ["删除线", "~~删除~~", "<p><del>删除</del></p>"],
  ["行内代码", "`代码`", "<p><code>代码</code></p>"],
  ["行内数学公式", "$x+y=z$", "<p><c-math>x+y=z</c-math></p>"],
  ["换行符", "行1  \n行2", "<p>行1<br>行2</p>"],

  // 链接与图片
  ["普通链接", "[链接](https://example.com)", '<p><a href="https://example.com">链接</a></p>'],
  [
    "带标题链接",
    '[链接](https://example.com "提示")',
    '<p><a href="https://example.com" title="提示">链接</a></p>'
  ],
  [
    "图片",
    "![图片描述](https://example.com/1.png)",
    '<p><img src="https://example.com/1.png" alt="图片描述"></p>'
  ],
  [
    "带标题图片",
    '![图片描述](https://example.com/1.png "图标题")',
    '<p><img src="https://example.com/1.png" alt="图片描述" title="图标题"></p>'
  ],

  // 代码块
  ["无语言代码块", "```\nconst a = 1;\n```", "<pre><code>const a = 1;</code></pre>"],
  [
    "指定语言代码块",
    "```js\nconsole.log(1);\n```",
    '<pre><code class="language-js">console.log(1);</code></pre>'
  ],
  ["数学公式块", "$$\na^2 + b^2 = c^2\n$$", "<c-math>\na^2 + b^2 = c^2\n</c-math>"],

  // 引用与警告块
  ["普通引用", "> 引用文本", "<blockquote><p>引用文本</p></blockquote>"],
  [
    "GitHub 告警块",
    "> [!NOTE]\n> 提示内容",
    '<blockquote class="q note"><b class="qt"><i class="qi"></i>NOTE</b><p>提示内容</p></blockquote>'
  ],

  // 列表
  ["无序列表", "- 项1\n- 项2", "<ul><li>项1</li><li>项2</li></ul>"],
  ["有序列表", "1. 项1\n2. 项2", "<ol><li>项1</li><li>项2</li></ol>"],
  ["有序列表自定义起始序号", "3. 项3\n4. 项4", '<ol start="3"><li>项3</li><li>项4</li></ol>'],
  [
    "任务列表",
    "- [ ] 未完成\n- [x] 已完成",
    '<ul><li><input type="checkbox" disabled> 未完成</li><li><input type="checkbox" disabled checked> 已完成</li></ul>'
  ],

  // 分隔线
  ["分隔线", "---", "<hr>"],

  // 表格
  [
    "基础表格与对齐",
    "| 标题1 | 标题2 | 标题3 |\n| :--- | :---: | ---: |\n| 居左 | 居中 | 居右 |",
    '<table><thead><tr><th class="left">标题1</th><th class="center">标题2</th><th class="right">标题3</th></tr></thead><tbody><tr><td class="left">居左</td><td class="center">居中</td><td class="right">居右</td></tr></tbody></table>'
  ],

  // HTML 块
  ["原生 HTML 块", '<div class="box"><span>内容</span></div>', '<div class="box"><span>内容</span></div>\n']
];

CASES.forEach(([desc, input, output]) => {
  test(desc, () => {
    expect(md2htm(input)).toBe(output);
  });
});
