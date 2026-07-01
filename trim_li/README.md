[English](#en) | [中文](#zh)

---

<a id="en"></a>
# trim_li : High-performance line-trimming, line-filtering, and text restoration library

- [trim_li : High-performance line-trimming, line-filtering, and text restoration library](#trim_li-high-performance-line-trimming-line-filtering-and-text-restoration-library)
  - [Usage](#usage)
  - [Features](#features)
  - [Design](#design)
  - [Stack](#stack)
  - [Directory Structure](#directory-structure)
  - [API](#api)
    - [Type Alias `Li`](#type-alias-li)
    - [Function `trim_li`](#function-trim_li)
    - [Struct `Restore`](#struct-restore)
      - [Method `Restore::load`](#method-restoreload)
  - [History](#history)
  - [About](#about)

High-performance, zero-copy line processing library in Rust. Scans byte streams using SIMD, trims trailing whitespaces, and filters trailing empty lines to extract non-empty lines, while providing a high-performance text restorer (`Restore`) based on roaring bitmap (`RoaringBitmap`).

## Usage

```rust
use trim_li::trim_li;

fn main() {
  let txt = "  hello world  \r\n  \n  rust language  \n\n  ";
  let (restore, li) = trim_li(txt);

  let li_strs: Vec<&str> = li.iter().map(|s| s.as_str()).collect();
  assert_eq!(li_strs, vec!["  hello world", "  rust language"]);

  // Restores the text, intermediate empty lines are kept without trailing spaces, trailing empty lines are trimmed
  let restored = restore.load(&li).unwrap();
  assert_eq!(restored.as_str(), "  hello world\n\n  rust language");
}
```

## Features

- **SIMD Acceleration**: Utilizes `memchr` for hardware-accelerated scanning of newline bytes.
- **Zero-Copy Extraction**: Extracted non-empty lines directly borrow substrings from the original string slice (`hipstr::HipStr`), avoiding extra allocations.
- **Zero Heap Allocation**: Immediately short-circuits empty string inputs (`""`) to guarantee zero heap allocation.
- **Efficient Restoration**: `Restore::load` combines a `RoaringBitmap` iterator to reduce the reconstruction complexity from $O(\text{total\_lines})$ to $O(\text{non\_empty\_count})$ while eliminating runtime bounds checks. It leverages highly-optimized `Vec::resize` based memory filling for ultra-fast text concatenation.
- **Smart Trailing Trim**: The restored text strips trailing spaces from all lines and discards trailing empty lines, keeping only meaningful indentation and intermediate empty lines.
- **Serialization**: `Restore` supports serialization to and deserialization from binary byte streams (`&[u8]` / `Vec<u8>`) via `From` / `Into` for easy transmission or persistence.

## Design

`trim_li` runs a scanning loop using dual pointers and `memchr2` over the byte slice of the input. In each line iteration, it trims trailing whitespaces. If the line is non-empty, it stores it as a borrowed `HipStr` and records its line index in a roaring bitmap (`RoaringBitmap`). Trailing empty lines are naturally discarded as they are not followed by any non-empty lines. `Restore` exposes the `bitmap` containing the indices of non-empty lines to efficiently splice them back into a unified text.

## Stack

- Core Language: Rust
- Dependencies: `memchr`, `hipstr`, `roaring`

## Directory Structure

```text
.
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── main.rs
```

## API

### Type Alias `Li`

```rust
pub type Li<'a> = Vec<hipstr::HipStr<'a>>;
```

### Function `trim_li`

```rust
pub fn trim_li(txt: &str) -> (Restore, Li<'_>)
```

Splits the input string into lines, trims trailing whitespaces and trailing empty lines, and returns the restoration handler alongside the list of non-empty lines.

### Struct `Restore`

```rust
pub struct Restore {
  pub bitmap: roaring::RoaringBitmap,
}
```

#### Method `Restore::load`

```rust
pub fn load<S: AsRef<str>>(&self, lines: &[S]) -> Option<hipstr::HipStr<'static>>
```

Reconstructs the original text by concatenating the provided (optionally modified) non-empty lines with the recorded empty lines. Returns `None` if the input slice length does not match the expected non-empty line count.

## History

The term "Line Feed" (LF, `\n`) and "Carriage Return" (CR, `\r`) originated from physical typewriters and early teleprinters.

In mechanical typewriters, a carriage return carriage assembly physically moved the paper carriage back to the left margin, while a line feed mechanism rotated the cylinder to advance the paper down by one line. Early computers inherited these control characters to represent newlines.

Microsoft DOS and Windows adopted the `CRLF` sequence, matching the teleprinter standard. Unix systems simplified newlines to a single `LF` to save memory, while early Apple Macintosh systems used a single `CR`. Modern text processing utilities must robustly normalize these distinct line endings while maintaining processing efficiency.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# trim_li : 过滤空行、修剪行尾空白及高性能文本还原库

- [trim_li : 过滤空行、修剪行尾空白及高性能文本还原库](#trim_li-过滤空行修剪行尾空白及高性能文本还原库)
  - [使用演示](#使用演示)
  - [特性介绍](#特性介绍)
  - [设计思路](#设计思路)
  - [技术堆栈](#技术堆栈)
  - [目录结构](#目录结构)
  - [API 说明](#api-说明)
    - [类型别名 `Li`](#类型别名-li)
    - [函数 `trim_li`](#函数-trim_li)
    - [结构体 `Restore`](#结构体-restore)
      - [方法 `Restore::load`](#方法-restoreload)
  - [历史背景](#历史背景)
  - [关于](#关于)

高效、零拷贝的 Rust 行处理函数与还原机制。使用 SIMD 扫描字节流，自动去除行尾空白并过滤尾部空行，提取非空行列表。并提供基于咆哮位图（`RoaringBitmap`）的高性能文本还原控制体 `Restore`。

## 使用演示

```rust
use trim_li::trim_li;

fn main() {
  let txt = "  hello world  \r\n  \n  rust language  \n\n  ";
  let (restore, li) = trim_li(txt);

  let li_strs: Vec<&str> = li.iter().map(|s| s.as_str()).collect();
  assert_eq!(li_strs, vec!["  hello world", "  rust language"]);

  // 还原文本，中间的空行被保留且去除尾部缩进，结尾被 trim
  let restored = restore.load(&li).unwrap();
  assert_eq!(restored.as_str(), "  hello world\n\n  rust language");
}
```

## 特性介绍

- **SIMD 加速**：依托 `memchr` 库，借助硬件指令加速检索换行符。
- **零拷贝提取**：提取的非空行列表直接借用原字符串切片（`hipstr::HipStr`），无额外内存拷贝。
- **零内存分配**：空字符串输入 (`""`) 会触发极速短路处理，确保零堆内存分配。
- **高效还原**：`Restore::load` 结合 `RoaringBitmap` 迭代器，将还原复杂度从 $O(\text{总行数})$ 降至 $O(\text{非空行数})$，且规避运行时越界检查。在还原过程中利用高度优化的 `Vec::resize` 进行向量化内存填充，实现极速文本拼接。
- **去除尾缩进**：还原后的文本去除了行尾的空白字符和结尾的空行，仅保留有价值的缩进和中间空行。
- **序列化支持**：`Restore` 支持通过 `From`/`Into` 与二进制字节流（`&[u8]`/`Vec<u8>`）互转，便于持久化和网络传输。

## 设计思路

`trim_li` 基于双指针和 `memchr2` 扫描字节流。在每行截取时，剥离右侧尾部空白字符。如果为非空行，将其存储为借用的 `HipStr` 并将该行索引记录于咆哮位图（`RoaringBitmap`）中。尾部的空行由于没有后续非空行被自然过滤。`Restore` 直接曝光其包含的 `bitmap` 字段（记录所有非空行的行索引），在还原（`load`）时结合传入的非空行列表进行极速文本拼接。

## 技术堆栈

- 核心语言：Rust
- 依赖库：`memchr`, `hipstr`, `roaring`

## 目录结构

```text
.
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── main.rs
```

## API 说明

### 类型别名 `Li`

```rust
pub type Li<'a> = Vec<hipstr::HipStr<'a>>;
```

### 函数 `trim_li`

```rust
pub fn trim_li(txt: &str) -> (Restore, Li<'_>)
```

基于传入的字符串切片进行分行、去除尾随空白与尾随空行，返回还原信息与非空行列表。

### 结构体 `Restore`

```rust
pub struct Restore {
  pub bitmap: roaring::RoaringBitmap,
}
```

#### 方法 `Restore::load`

```rust
pub fn load<S: AsRef<str>>(&self, lines: &[S]) -> Option<hipstr::HipStr<'static>>
```

根据还原信息以及外部传入的（可能经过修改的）非空行列表，拼接并还原出最终文本。如果传入的列表长度不匹配，返回 `None`。

## 历史背景

换行符（LF, `\n`）与回车符（CR, `\r`）的历史可追溯至机械打字机及电传打字机时代。

打字机工作时，回车（Carriage Return）操作用于将纸架物理复位回左边界，而换行（Line Feed）操作则用于转动滚筒将纸张向上推移一行。早期计算机继承了这组控制字符。

微软 DOS 及 Windows 操作系统采用 `CRLF` 组合以兼容电传打字机规范。Unix 系统为节省内存，精简并统一采用单字节 `LF`。早期苹果 Macintosh 系统则使用单字节 `CR`。现代文本处理组件必须高度兼容上述多种换行符，同时在解析性能上做到极致。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

