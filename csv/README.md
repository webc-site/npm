[English](#en) | [中文](#zh)

---

<a id="en"></a>
# @1-/csv : A minimalist and ultra-fast CSV encoder and decoder package

- [Features](#features)
- [Usage](#usage)
  - [Installation](#installation)
  - [Single-line encode](#single-line-encode)
  - [Single-line decode](#single-line-decode)
  - [Multi-line encode](#multi-line-encode)
  - [Multi-line decode](#multi-line-decode)
  - [File I/O](#file-io)
- [Design Principles](#design-principles)
- [Tech Stack](#tech-stack)
- [Code Structure](#code-structure)
- [Historical Note](#historical-note)
- [About](#about)

## Features

High-performance CSV serialization/deserialization. Supports both single-line and multi-line CSV processing with full RFC 4180 compliance and real-world fault tolerance. Implements character-code based operations for maximum performance.

## Usage

### Installation

```bash
bun add @1-/csv
```

### Single-line encode

```javascript
import csvE from "@1-/csv/csvE";

const data = ["Name", "Age", "20"];

const csv = csvE(data);
// Output: Name,Age,20
```

### Single-line decode

```javascript
import csvD from "@1-/csv/csvD";

const csv = "Name,Age,20";
const data = csvD(csv);
// Output: ["Name", "Age", "20"]
```

### Multi-line encode

```javascript
import dumps from "@1-/csv/dumps";

const data = [
  ["Name", "Age"],
  ["John", "25"],
  ["Jane", "30"]
];

const csv = dumps(data);
// Output: Name,Age\nJohn,25\nJane,30
```

### Multi-line decode

```javascript
import loads from "@1-/csv/loads";

const csv = "Name,Age\nJohn,25\nJane,30";
const data = loads(csv);
// Output: [["Name", "Age"], ["John", "25"], ["Jane", "30"]]
```

### File I/O

```javascript
import dump from "@1-/csv/dump";
import load from "@1-/csv/load";

// Write CSV file
await dump("data.csv", [
  ["Name", "Age"],
  ["John", "25"],
  ["Jane", "30"]
]);

// Read CSV file
const data = await load("data.csv");
```

## Design Principles

Pure functional implementation using character code operations (ASCII 34=", 44=,, 10=\n, 13=\r). Supports RFC 4180 and real-world variants:

- Null/undefined handling (converted to empty string)
- Quote escaping (`""` → `"`)
- Cross-platform line endings (`\n`, `\r`, `\r\n`)
- Fault-tolerant parsing (handles incomplete lines, trailing commas, etc.)
- Multi-line CSV batch processing
- Zero build step, runs directly on ECMAScript 2023+ environments

```mermaid
graph TD
    A[Input Data] --> B{Single or multi-line}
    B -->|Single| C[csvE / csvD]
    B -->|Multi| D[dumps / loads]
    C --> E[Character code operations]
    D --> E
    E --> F[RFC 4180 compliant]
    F --> G[High-performance implementation]
```

## Tech Stack

- Runtime: ECMAScript 2023+
- Dependencies: `@1-/read` (for file reading only)
- Testing: `mitata`
- License: MulanPSL-2.0

## Code Structure

```
src/
├── csvD.js     # Single-line decoder, RFC 4180 compatible, fault-tolerant
├── csvE.js     # Single-line encoder, auto quoting/escaping
├── dumps.js    # Multi-line encoder, convert array of arrays to CSV string
├── loads.js    # Multi-line decoder, parse CSV string to array of arrays
├── dump.js     # File writer, write data to CSV file
├── load.js     # File reader, read data from CSV file
├── csvD.d.ts   # Type declarations: (str: string) => string[]
├── csvE.d.ts   # Type declarations: (row: any[]) => string
├── dumps.d.ts  # Type declarations: (li: any[][]) => string
├── loads.d.ts  # Type declarations: (str: string) => string[][]
├── dump.d.ts   # Type declarations: (path: string, li: any[][]) => Promise<void>
└── load.d.ts   # Type declarations: (path: string) => Promise<string[][]>
```

## Historical Note

CSV originated in 1970s IBM System/360. Lotus 1-2-3 (1983) established it as de facto standard. RFC 4180 (2005) attempted standardization, but permissiveness remains a challenge. This project achieves dual compatibility through extreme minimalism while providing both single-line and multi-line processing capabilities.


## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# @1-/csv : 极简、极速的 CSV 编码与解码工具包

- [功能介绍](#功能介绍)
- [使用演示](#使用演示)
  - [安装](#安装)
  - [单行编码](#单行编码)
  - [单行解码](#单行解码)
  - [多行编码](#多行编码)
  - [多行解码](#多行解码)
  - [文件读写](#文件读写)
- [设计思路](#设计思路)
- [技术栈](#技术栈)
- [代码结构](#代码结构)
- [历史故事](#历史故事)
- [关于](#关于)

## 功能介绍

提供高性能的 CSV 序列化与反序列化功能。支持单行与多行 CSV 处理，完全兼容 RFC 4180 标准，同时具备现实世界容错能力。基于字符码直接操作实现极致性能。

## 使用演示

### 安装

```bash
bun add @1-/csv
```

### 单行编码

```javascript
import csvE from "@1-/csv/csvE";

const data = ["姓名", "年龄", "20"];

const csv = csvE(data);
// 输出: 姓名,年龄,20
```

### 单行解码

```javascript
import csvD from "@1-/csv/csvD";

const csv = "姓名,年龄,20";
const data = csvD(csv);
// 输出: ["姓名", "年龄", "20"]
```

### 多行编码

```javascript
import dumps from "@1-/csv/dumps";

const data = [
  ["姓名", "年龄"],
  ["张三", "25"],
  ["李四", "30"]
];

const csv = dumps(data);
// 输出: 姓名,年龄\n张三,25\n李四,30
```

### 多行解码

```javascript
import loads from "@1-/csv/loads";

const csv = "姓名,年龄\n张三,25\n李四,30";
const data = loads(csv);
// 输出: [["姓名", "年龄"], ["张三", "25"], ["李四", "30"]]
```

### 文件读写

```javascript
import dump from "@1-/csv/dump";
import load from "@1-/csv/load";

// 写入 CSV 文件
await dump("data.csv", [
  ["姓名", "年龄"],
  ["张三", "25"],
  ["李四", "30"]
]);

// 读取 CSV 文件
const data = await load("data.csv");
```

## 设计思路

采用纯函数式实现，基于字符码直接操作（ASCII 34=", 44=,, 10=\n, 13=\r）。支持 RFC 4180 及常见变体：

- 空值与 null/undefined 处理（转换为空字符串）
- 双引号转义（`""` → `"`）
- 跨平台换行符（`\n`, `\r`, `\r\n`）
- 容错解析（处理不完整行、尾随逗号等）
- 多行 CSV 批量处理
- 零构建步骤，直接运行于 ECMAScript 2023+ 环境

```mermaid
graph TD
    A[输入数据] --> B{单行还是多行}
    B -->|单行| C[csvE / csvD]
    B -->|多行| D[dumps / loads]
    C --> E[字符码直接操作]
    D --> E
    E --> F[RFC 4180 兼容]
    F --> G[高性能实现]
```

## 技术栈

- 运行时：ECMAScript 2023+
- 依赖：`@1-/read`（用于文件读取）
- 测试：`mitata`
- 许可证：MulanPSL-2.0

## 代码结构

```
src/
├── csvD.js     # 单行解码器，RFC 4180 兼容，容错解析
├── csvE.js     # 单行编码器，自动 quoting/escaping
├── dumps.js    # 多行编码器，将数组的数组转换为 CSV 字符串
├── loads.js    # 多行解码器，将 CSV 字符串解析为数组的数组
├── dump.js     # 文件写入器，将数据写入 CSV 文件
├── load.js     # 文件读取器，从 CSV 文件读取数据
├── csvD.d.ts   # 类型声明：(str: string) => string[]
├── csvE.d.ts   # 类型声明：(row: any[]) => string
├── dumps.d.ts  # 类型声明：(li: any[][]) => string
├── loads.d.ts  # 类型声明：(str: string) => string[][]
├── dump.d.ts   # 类型声明：(path: string, li: any[][]) => Promise<void>
└── load.d.ts   # 类型声明：(path: string) => Promise<string[][]>
```

## 历史故事

CSV 格式源于 1970 年代 IBM System/360。1983 年 Lotus 1-2-3 确立其为事实标准。RFC 4180（2005）尝试标准化，但宽松性仍是挑战。本项目以极致精简实现双重兼容，同时提供单行与多行处理能力。


## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

