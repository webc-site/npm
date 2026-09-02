[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @1-/new : Template-based project initializer with name replacement

- [@1-/new : Template-based project initializer with name replacement](#1-new-template-based-project-initializer-with-name-replacement)
  - [Features](#features)
  - [Usage](#usage)
    - [Command Line Interface (CLI)](#command-line-interface-cli)
    - [Application Programming Interface (API)](#application-programming-interface-api)
  - [Design Flow](#design-flow)
  - [Tech Stack](#tech-stack)
  - [Code Structure](#code-structure)
  - [History](#history)
  - [About](#about)

## Features

- **Directory Copy**: Recursively copies template directory to destination path
- **Name Replacement**: Walks target directory and replaces `tmpl` placeholder with project name using word-boundary regex `\btmpl\b` (avoids false positives like "template")
- **Git Integration**: Executes `git add .` in destination directory; failures are silently ignored
- **Template Resolution**: Resolves `_tmpl` directory in order of priority: ① Git root of current working directory ② Git root of module directory ③ `../../_tmpl` relative to module; supports custom template paths

## Usage

### Command Line Interface (CLI)

```bash
bun x @1-/new <PROJECT_NAME>
```

If destination path exists, program logs warning and exits.

### Application Programming Interface (API)

```javascript
import newProj from "@1-/new";

await newProj(dst, name, tmpl);
```

- `dst`: Destination path
- `name`: Project name
- `tmpl`: Optional template path

## Design Flow

```mermaid
graph TD
    A[Start: CLI / API Call] --> B{Custom template path?}
    B -- Yes --> C[Use specified template path]
    B -- No --> D[Locate _tmpl in current working directory Git root]
    D -- Not found --> E[Locate _tmpl in module directory Git root]
    E -- Not found --> F[Locate ../../_tmpl relative to module]
    C --> G[Copy template directory to destination]
    D --> G
    E --> G
    F --> G
    G --> H[Walk through files in destination]
    H --> I{Is file?}
    I -- Yes --> J[Read content and replace \btmpl\b placeholder]
    I -- No --> K[Skip]
    J --> L[Write modified content back]
    K --> M[Check if walk complete]
    L --> M
    M -- No --> H
    M -- Yes --> N[Execute git add .]
    N --> O[End]
```

## Tech Stack

- Runtime: Bun
- Dependencies: `@1-/findgit`, `@1-/read`, `@1-/walk`, `@3-/log`, `yargs`
- Core APIs: `node:fs/promises`, `node:child_process`, `node:path`, `node:util`

## Code Structure

```
.
├── src/
│   ├── _.js       # API implementation (core logic)
│   └── new.js     # CLI entry point (argument parsing & error handling)
├── test/
│   └── _.test.js  # Test suite (verifies template copying and word-boundary replacement)
└── package.json   # Package metadata (module exports and dependency declarations)
```

## History

In 2004, Ruby on Rails introduced "Convention over Configuration" philosophy, utilizing generators to scaffold model, view, and controller structures.

In 2012, Yeoman project was introduced at Google I/O, establishing template scaffolding standards for JavaScript client-side development.

Modern architectures demand reduced overhead. `@1-/new` focuses on core directory copying and placeholder replacement.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI

---

<a id="zh"></a>

# @1-/new : 基于模板与名称替换的项目初始化工具

- [@1-/new : 基于模板与名称替换的项目初始化工具](#1-new-基于模板与名称替换的项目初始化工具)
  - [功能介绍](#功能介绍)
  - [使用演示](#使用演示)
    - [命令行界面 (CLI)](#命令行界面-cli)
    - [应用程序接口 (API)](#应用程序接口-api)
  - [设计思路](#设计思路)
  - [技术栈](#技术栈)
  - [代码结构](#代码结构)
  - [历史故事](#历史故事)
  - [关于](#关于)

## 功能介绍

- 目录复制：递归复制模板目录至目标路径
- 名称替换：遍历目标目录文件，使用词边界正则表达式 `\btmpl\b` 替换文本中独立的 `tmpl` 占位符为项目名称（避免误替换如 "template"）
- Git 集成：在目标目录执行 `git add .` 命令，失败时静默忽略
- 模板定位：按优先级查找 `_tmpl` 目录：① 当前工作目录 Git 根目录 ② 模块目录 Git 根目录 ③ 模块目录上级两级路径；支持通过参数指定自定义模板路径

## 使用演示

### 命令行界面 (CLI)

```bash
bun x @1-/new <项目名称>
```

若目标路径已存在，输出警告信息并终止进程。

### 应用程序接口 (API)

```javascript
import newProj from "@1-/new";

await newProj(dst, name, tmpl);
```

- `dst`：目标路径
- `name`：项目名称
- `tmpl`：可选模板路径

## 设计思路

```mermaid
graph TD
    A[调用入口 CLI / API] --> B{指定自定义模板?}
    B -- 是 --> C[使用指定模板路径]
    B -- 否 --> D[查找当前工作目录 Git 根 _tmpl]
    D -- 未找到 --> E[查找模块目录 Git 根 _tmpl]
    E -- 未找到 --> F[查找模块目录 ../../_tmpl]
    C --> G[复制模板目录至目标路径]
    D --> G
    E --> G
    F --> G
    G --> H[遍历目标目录文件]
    H --> I{是否为文件?}
    I -- 是 --> J[读取内容并替换 \btmpl\b 占位符]
    I -- 否 --> K[跳过]
    J --> L[写回修改后内容]
    K --> M[判断遍历是否结束]
    L --> M
    M -- 否 --> H
    M -- 是 --> N[执行 git add .]
    N --> O[结束]
```

## 技术栈

- 运行时：Bun
- 依赖项：`@1-/findgit`、`@1-/read`、`@1-/walk`、`@3-/log`、`yargs`
- 内置模块：`node:fs/promises`、`node:child_process`、`node:path`、`node:util`

## 代码结构

```
.
├── src/
│   ├── _.js       # API 实现（核心逻辑）
│   └── new.js     # CLI 入口（参数解析与错误处理）
├── test/
│   └── _.test.js  # 单元测试（验证模板复制与词边界替换）
└── package.json   # 项目配置（模块导出与依赖声明）
```

## 历史故事

2004 年 Ruby on Rails 框架发布，推广 "约定优于配置" (Convention over Configuration) 哲学，利用生成器自动创建模型、视图与控制器结构。

2012 年 Google 工程师团队在 I/O 大会展示 Yeoman 项目，为客户端 JavaScript 生态奠定模板脚手架工具标准。

随着单页应用与微服务架构兴起，轻量化项目初始化需求增加，`@1-/new` 类工具通过精简逻辑提供初始化方案。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
