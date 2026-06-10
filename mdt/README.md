[English](#en) | [中文](#zh)

---

<a id="en"></a>
# @1-/mdt : Recursively assemble Markdown templates and generate hierarchical TOC

- [@1-/mdt : Recursively assemble Markdown templates and generate hierarchical TOC](#1-mdt-recursively-assemble-markdown-templates-and-generate-hierarchical-toc)
  - [1. Features](#1-features)
  - [2. Usage Demonstration](#2-usage-demonstration)
    - [API Usage](#api-usage)
    - [CLI Tool](#cli-tool)
    - [Template Example (README.mdt)](#template-example-readmemdt)
  - [3. Design Idea](#3-design-idea)
  - [4. Tech Stack](#4-tech-stack)
  - [5. Code Structure](#5-code-structure)
  - [6. History](#6-history)
  - [About](#about)

## 1. Features

`mdt` parses and assembles Markdown templates with the following capabilities:

- **Recursive Assembly**: Imports external Markdown files using `<+ relative_path >` syntax with nested support

- **Block Rendering**: Splits documents by `---` into independent blocks for isolated rendering

- **TOC Generation**: Extracts headers within each document block to build hierarchical tables of contents with indentation

- **TOC Injection**: Inserts the generated TOC directly below the first header of each block

- **Code Block Bypass**: Ignores headers inside code blocks to prevent parsing errors

- **Anchor Translation**: Translates header text into compliant Markdown anchor links

## 2. Usage Demonstration

### API Usage

Import `mdt` and pass the template path and the package base directory:

```javascript
import renderMdt from "@1-/mdt";

const result = await renderMdt("path/to/README.mdt", "path/to/package");
console.log(result);
```

### CLI Tool

Run `mdt` directly to process all `.mdt` files in the current directory, or target specific paths:

```bash
# Scan current directory and process all .mdt files
bun x mdt

# Process specified file
bun x mdt README.mdt

# Process specified directory
bun x mdt ./docs
```

### Template Example (README.mdt)

```markdown
# Module Name

<+ ./docs/intro.md >

---

# Detailed Design

<+ ./docs/design.md >
```

## 3. Design Idea

The system splits the input template by `---` into independent blocks, processes them in parallel to recursively expand template references, parses headers to generate a hierarchical TOC for each block, and joins them back for final output.

```mermaid
graph TD
    Start[Read Template File]
    Split[Split into Blocks by ---]
    Map[Process Blocks in Parallel]
    Expand[Recursively Resolve External References]
    Parse[Parse Headers and Ignore Code Blocks]
    GenTOC[Generate Hierarchical TOC]
    Inject[Inject TOC below First Header]
    Join[Join Blocks with ---]
    End[Output Final Markdown Text]

    Start --> Split
    Split --> Map
    Map --> Expand
    Expand --> Parse
    Parse --> GenTOC
    GenTOC --> Inject
    Inject --> Join
    Join --> End
```

## 4. Tech Stack

- Runtime: [Bun](https://bun.sh/)

- Dependencies:
  - `@1-/md`: Normalizes Markdown newlines
  - `@1-/read`: Asynchronous file reader utility
  - `@1-/walk`: Directory file traversal utility
  - `@3-/log`: Console logging and warning utility
  - `yargs`: Command-line arguments parser

## 5. Code Structure

```
src/
├── _.js            # Entry point, splits blocks and coordinates rendering
├── blockRender.js  # Block renderer coordinating resolution, parsing, generation, and injection
├── linesRender.js  # Recursive line-by-line resolver for <+ relative_path > syntax
├── headerParse.js  # Header parser excluding headers inside code blocks
├── tocGen.js       # Indented TOC generator based on header levels
├── tocInject.js    # TOC injector inserting lists after the first header
└── anchor.js       # Header to URL anchor converter
```

## 6. History

In 2004, John Gruber and Aaron Swartz designed Markdown, enabling writing documents in easy-to-read plain text and converting to HTML. As software engineering scaled, technical documentation evolved from single files into complex file trees covering multiple languages and sub-modules.

Maintaining single-file documentation causes merge conflicts and retrieval difficulties. However, dividing documents into multiple separate files breaks table of contents navigation, anchor consistency, and relative links across chunks.

`mdt` addresses these issues directly. Avoiding the overhead of static site generators, it offers a lightweight assembly syntax with block-level TOC generation. Developers write isolated document fragments while the tool handles anchor calculation, hierarchy generation, and template assembly.


## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# @1-/mdt : 递归拼接 Markdown 模板并生成层级 TOC

- [@1-/mdt : 递归拼接 Markdown 模板并生成层级 TOC](#1-mdt-递归拼接-markdown-模板并生成层级-toc)
  - [1. 功能介绍](#1-功能介绍)
  - [2. 使用演示](#2-使用演示)
    - [API 调用](#api-调用)
    - [命令行工具](#命令行工具)
    - [模板示例 (README.mdt)](#模板示例-readmemdt)
  - [3. 设计思路](#3-设计思路)
  - [4. 技术栈](#4-技术栈)
  - [5. 代码结构](#5-代码结构)
  - [6. 历史故事](#6-历史故事)
  - [关于](#关于)

## 1. 功能介绍

`mdt` 解析与拼接 Markdown 模板，具有以下特性：

- **递归拼接**：使用 `<+ 相对路径 >` 语法导入外部 Markdown 文件，支持多层嵌套

- **分块渲染**：使用 `---` 分割文档块，各块采用独立上下文进行渲染

- **目录生成**：提取文档块内标题，生成具有缩进层级的 TOC 目录

- **目录插入**：自动将生成的 TOC 目录插入至文档块首个标题下方

- **过滤代码块**：提取标题时忽略代码块，防止误判

- **锚点转换**：标题文本转换为 Markdown 锚点链接

## 2. 使用演示

### API 调用

引入 `mdt` 并传入模板路径与项目根路径：

```javascript
import renderMdt from "@1-/mdt";

const result = await renderMdt("path/to/README.mdt", "path/to/package");
console.log(result);
```

### 命令行工具

运行 `mdt` 处理当前目录下 `.mdt` 文件，或指定路径：

```bash
# 处理当前目录所有 .mdt 文件
bun x mdt

# 处理指定文件
bun x mdt README.mdt

# 处理指定目录
bun x mdt ./docs
```

### 模板示例 (README.mdt)

```markdown
# 模块名称

<+ ./docs/intro.md >

---

# 详细设计

<+ ./docs/design.md >
```

## 3. 设计思路

系统以 `---` 将文档分割为独立数据块，并行渲染各数据块并递归展开外部模板，解析标题生成层级目录并自动插入，拼接输出最终的文档。

```mermaid
graph TD
    Start[读取模板文件]
    Split[以 --- 分割文档块]
    Map[并行渲染文档块]
    Expand[递归展开外部引用]
    Parse[解析标题避开代码块]
    GenTOC[生成层级 TOC]
    Inject[插入 TOC 至首个标题下方]
    Join[以 --- 重新拼接]
    End[输出最终 Markdown 文本]

    Start --> Split
    Split --> Map
    Map --> Expand
    Expand --> Parse
    Parse --> GenTOC
    GenTOC --> Inject
    Inject --> Join
    Join --> End
```

## 4. 技术栈

- 运行时：[Bun](https://bun.sh/)

- 依赖库：
  - `@1-/md`：格式化 Markdown 换行
  - `@1-/read`：异步读取文件
  - `@1-/walk`：遍历目录
  - `@3-/log`：控制台日志与警告
  - `yargs`：命令行参数解析

## 5. 代码结构

```
src/
├── _.js            # 入口，分割文档块并调用块渲染
├── blockRender.js  # 块级渲染，协调展开、解析、生成与插入流程
├── linesRender.js  # 递归处理引用文件
├── headerParse.js  # 解析段落标题，避开代码块
├── tocGen.js       # 生成带缩进的 TOC 列表
├── tocInject.js    # 将 TOC 列表插入到首个标题后
└── anchor.js       # 标题文本转为 URL 锚点
```

## 6. 历史故事

2004 年 John Gruber 与 Aaron Swartz 共同设计 Markdown，旨在用纯文本编写文档并转换为 HTML。伴随软件工程规模扩张，文档演变为包含多语言、多模块的文件树。

维护大型项目文档时，开发者面临取舍。使用单体 Markdown 文件会导致协作冲突、检索困难。将文档拆分为多文件会导致目录跳转失效、目录层级混乱、锚点引用破损。

`mdt` 解决这一痛点。避开静态网站生成器（SSG）的配置，提供模板拼接语法与自动化块级 TOC 生成机制。开发者专注于编写文档片段，系统处理锚点计算、层级目录生成与模板拼接。


## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

