[English](#en) | [中文](#zh)

---

<a id="en"></a>
# @1-/md : Extract Code Block Positions and Languages from Markdown

## Features

Provides Markdown text parsing capabilities.
Splits Markdown text by line, filtering trailing whitespace.
Identifies Markdown code blocks.
Extracts code block languages, recording starting and ending line numbers.
Supports identification and positioning of unclosed code blocks.

## Tech Stack

- **Runtime**: Bun / Node.js
- **Language**: JavaScript (ES Modules)
- **Linter/Formatter**: Oxlint / Oxfmt

## Directory Structure

```
.
├── src/
│   ├── const/
│   │   └── BT3.js       # Code block identifier constant
│   ├── code.js          # Code block extraction logic
│   └── li.js            # Line splitting and trimming logic
└── tests/
    ├── _.test.js        # Unit tests
    └── test.md          # Markdown file for testing
```

## Design thinking

System consists of line splitting module and code block extraction module.

1. Line splitting module normalizes line breaks, splits text into line array, and trims trailing whitespace.
2. Code block extraction module iterates through line array, using state machine to identify code block delimiters.
3. Records code block language and start line. Records end line upon matching ending delimiter or reaching end of text.

````mermaid
graph TD
    RawText[Raw Markdown Text] --> |li.js| LineArray[Line Array]
    LineArray --> |code.js Iteration| StateCheck{Inside Code Block?}
    StateCheck --> |No: Match ```lang| StartBlock[Record Start Line & Language]
    StateCheck --> |Yes: Match ```| EndBlock[Record End Line & Export]
    StateCheck --> |Yes: Reach EOF| EOFBlock[Record EOF Line & Export]
````

## Usage

```javascript
import li from "@1-/md/li.js";
import code from "@1-/md/code.js";

const markdownContent = `# Title

\`\`\`javascript
const val = 1;
\`\`\`
`;

// 1. Split text into lines
const lines = li(markdownContent);

// 2. Identify code block positions
const blocks = code(lines);

console.log(blocks);
// Output: [ [ 'javascript', 3, 5 ] ]
```

## Historical Trivia

Markdown was created in 2004 by John Gruber and Aaron Swartz.
The goal was to enable writing easy-to-read and easy-to-write plain text formatting, converting it into structurally valid XHTML or HTML.
Fenced code blocks were not part of the original Markdown specification. They were popularized by GitHub Flavored Markdown, greatly simplifying code inclusion in documentation, and eventually becoming an industry standard.
---

[WebC.site](https://webc.site) : A new paradigm of web development for AI

---

<a id="zh"></a>
# @1-/md : 解析 Markdown 提取代码块位置与语言类型

## 功能介绍

提供 Markdown 文本解析功能。
将 Markdown 文本按行拆分，过滤行尾空白。
识别 Markdown 中的代码块。
提取代码块语言类型，记录代码块在文本中的起始行号与结束行号。
支持未闭合代码块的识别与定位。

## 技术栈

- **Runtime**: Bun / Node.js
- **Language**: JavaScript (ES Modules)
- **Linter/Formatter**: Oxlint / Oxfmt

## 目录结构

```
.
├── src/
│   ├── const/
│   │   └── BT3.js       # 代码块标识符常量
│   ├── code.js          # 提取代码块逻辑
│   └── li.js            # 文本按行拆分与处理逻辑
└── tests/
    ├── _.test.js        # 单元测试
    └── test.md          # 测试用 Markdown 文件
```

## 设计思路

系统由行拆分模块与代码块识别模块构成。

1. 行拆分模块统一文本换行符，分割为行数组，并去除行尾空白。
2. 代码块识别模块遍历行数组，通过状态机识别特定标识。
3. 记录代码块语言类型及起始行号，检测到闭合标识或到达文本末尾时，记录结束行号并保存。

````mermaid
graph TD
    RawText[原始 Markdown 文本] --> |li.js| LineArray[行数组]
    LineArray --> |code.js 遍历识别| StateCheck{是否处于代码块中}
    StateCheck --> |否: 匹配 ```lang| StartBlock[记录起始行号与语言]
    StateCheck --> |是: 匹配 ```| EndBlock[记录结束行号并输出]
    StateCheck --> |是: 到达文件末尾| EOFBlock[以末尾行号结束并输出]
````

## 使用演示

```javascript
import li from "@1-/md/li.js";
import code from "@1-/md/code.js";

const markdownContent = `# Title

\`\`\`javascript
const val = 1;
\`\`\`
`;

// 1. 将文本拆分为行
const lines = li(markdownContent);

// 2. 识别代码块位置
const blocks = code(lines);

console.log(blocks);
// 输出: [ [ 'javascript', 3, 5 ] ]
```

## 历史小故事

Markdown 由约翰·格鲁伯与亚伦·斯沃茨于 2004 年共同设计。
其初衷是允许人们使用易读易写的纯文本格式编写文档，并转换为结构化的 HTML。
围栏代码块语法最初并非 Markdown 官方标准的一部分，而是由 GitHub 在 GitHub Flavored Markdown 中推广，极大地简化了技术文档编写，现已成为 Markdown 通用标准。
---

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
