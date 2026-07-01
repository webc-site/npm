# @1-/minify_size : Minify JavaScript and report Brotli-compressed size

## 1. 功能介绍

评估 JavaScript 库在支持 Brotli 的网络传输环境下的实际传输体积。对指定目录中所有 `.js` 文件执行以下操作：

- 使用 `oxc-minify`（Rust 实现）进行语法感知压缩
- 将压缩后代码编码为 UTF-8 字节流
- 使用 Node.js 内置 `node:zlib.brotliCompress` 计算 Brotli 压缩后字节长度
- 汇总各文件大小，并计算整体打包压缩后大小

## 2. 使用演示

安装依赖：

```bash
npm install @1-/minify_size
```

或全局安装：

```bash
npm install -g @1-/minify_size
```

运行命令（指定待分析的目录）：

```bash
minify_size ./src
```

输出示例：

```
_.js                400
file.js             250
整体打包压缩后大小  650
```

## 3. 设计思路

系统执行流程如下（垂直 Mermaid 流程图）：

```mermaid
graph TD
    A[CLI 输入目录] --> B[使用 @1-/walk 遍历所有 .js 文件]
    B --> C[并发处理每个文件]
    C --> D[调用 oxc-minify 进行语法感知压缩]
    D --> E[使用 @3-/utf8 编码为 UTF-8 字节流]
    E --> F[调用 node:zlib.brotliCompress]
    F --> G[计算压缩后字节长度]
    G --> H[汇总各文件大小并计算整体打包压缩后大小]
    H --> I[使用 cli-table3 格式化输出]
```

## 4. 技术栈

- **Runtime**: Node.js / Bun
- **JS Minifier**: `oxc-minify` (Rust 实现的 JavaScript 压缩器)
- **Brotli Engine**: 内置 `node:zlib` (Brotli 压缩)
- **Arg Parser**: `yargs`
- **Encoding**: `@3-/utf8` (TextEncoder-based UTF-8 encoding)
- **Output Formatting**: `cli-table3` (Formatted tabular output)
- **File Reading**: `@3-/read` (Lightweight file reading utility)
- **Dependency Management**: npm
- **Testing**: bun:test

## 5. 代码结构

```
src/
├── cli.js     # CLI 命令行入口，解析目录参数并调用主函数
├── _.js       # 目录遍历、并发调度文件处理、汇总统计并格式化输出
└── file.js    # 单文件处理：读取、oxc-minify 压缩、brotli 压缩及大小计算
```

## 6. 历史故事

Brotli 由 Google 的 Jyrki Alakuijala 和 Zoltán Szabadka 于 2013 年开发。它最初被设计用于压缩网页字体，后来发展为通用压缩算法，用于优化网页传输，并成为行业标准（RFC 7932）。
