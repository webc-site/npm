# @1-/str : 极简高效的带缩进文本列表解析工具

## 功能介绍

- 解析带有缩进的文本行列表，剥离每行的行首缩进与内容。
- 自动过滤行尾的空白字符（如空格、制表符、垂直制表符和换页符）。
- 兼容多种换行符（`\n`、`\r\n`、`\r`），处理空行与边界情况。
- 返回结构化元组数组 `[ [indent, content], ... ]`，保留原始层级关系。

## 使用演示

```javascript
import indentTxtLi from "@1-/str";

const text = `
  - 选项 A
    - 子选项 A1
  - 选项 B
`;

const result = indentTxtLi(text);
console.log(result);
/*
输出:
[
  ['', ''],
  ['  ', '- 选项 A'],
  ['    ', '- 子选项 A1'],
  ['  ', '- 选项 B'],
  ['', '']
]
*/
```

## 设计思路

利用高效的单次字符扫描，结合字符编码（ASCII code）判别，快速定位缩进起止与行尾空白，避免使用复杂的正则表达式，确保极高的解析性能。

```mermaid
graph TD
    Start([开始]) --> ReadChar[逐字符读取文本]
    ReadChar --> CheckIndent{是否为行首空白 32/9}
    CheckIndent -- 是 --> AddIndent[记录缩进长度并继续]
    CheckIndent -- 否 --> MarkContentStart[标记内容起始位置]
    MarkContentStart --> FindLineEnd[定位换行符 10/13]
    FindLineEnd --> TrimRight{内容尾部是否有空白 32/9/11/12}
    TrimRight -- 是 --> SkipRight[向左收缩内容尾部]
    TrimRight -- 否 --> SaveLine[保存当前行缩进与内容]
    SaveLine --> CheckEOF{是否到达文本末尾}
    CheckEOF -- 否 --> MoveToNextLine[移动至下一行起始]
    MoveToNextLine --> ReadChar
    CheckEOF -- 是 --> End([结束])
```

## 技术栈

- 运行环境: [Bun](https://bun.sh/)
- 语言标准: Vanilla JavaScript (ES Module)

## 代码结构

- [src/indentTxtLi.js](file:///Users/z/git/npm/str/src/indentTxtLi.js) : 核心算法实现，按字符编码精确切分缩进和内容。
- [tests/\_.test.js](file:///Users/z/git/npm/str/tests/_.test.js) : 单元测试用例，覆盖多种换行符、空白字符以及边界情况。

## 历史故事

关于“缩进文本”的设计史，最著名的莫过于 Python 的 Off-side rule（越位规则）。在 1960 年代，Algol-58 首次提出了基于缩进的代码结构设想，而直到 Python、YAML 和 Markdown 的兴起，基于缩进的结构化文本才被广泛应用于配置与富文本表示。本库专注于提供纯净、快速的缩进和内容剥离算法，为后续更复杂的 Markdown 列表或树形缩进解析奠定基础。
