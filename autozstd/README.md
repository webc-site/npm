[English](#en) | [中文](#zh)

---

<a id="en"></a>

# autozstd : High performance Zstd envelope compression with fallback

- [autozstd : High performance Zstd envelope compression with fallback](#autozstd-high-performance-zstd-envelope-compression-with-fallback)
  - [Overview](#overview)
  - [Usage](#usage)
  - [Features](#features)
  - [Design](#design)
  - [Tech Stack](#tech-stack)
  - [Directory Structure](#directory-structure)
  - [API Docs](#api-docs)
  - [History & Background](#history-background)
  - [About](#about)

## Overview

High-performance Zstandard (Zstd) compression wrapper for Rust using the envelope pattern. Automatically falls back to raw storage when compressed output size is larger than or equal to original data size, ensuring optimal storage footprint for tiny or uncompressible payloads. Strips Zstd frame magic headers using native magicless zstd configurations for byte-level bandwidth savings.

## Usage

```rust
  use autozstd::{encode, decode};

  let data = b"hello world".repeat(100);
  let encoded = encode(&data, None).unwrap();
  let decoded = decode(&encoded).unwrap();
  assert_eq!(decoded, data);
```

## Features

- **Envelope Pattern:** Prepends single byte to distinguish raw payload from compressed payload.
- **Automatic Fallback:** Prevents payload size growth by falling back to uncompressed storage if compression yields no size reduction.
- **Native Magicless Format:** Directly configures Zstd to skip generating and expecting the 4-byte magic number (`[0x28, 0xB5, 0x2F, 0xFD]`), optimizing bandwidth.
- **Single Heap Allocation:** Employs `std::io::Cursor` over `Vec` to offset output, guaranteeing exactly one allocation in the entire compression path.
- **100% Safe Rust Wrapper:** Completely safe wrapper around the official C Zstd bindings.

## Design

```mermaid
graph TD
  Start[Input Data] --> CheckEmpty{Is Empty?}
  CheckEmpty -- Yes --> ReturnRaw[Return raw type byte only]
  CheckEmpty -- No --> Compress[Compress with Magicless Zstd]
  Compress --> CompareSize{Compressed size < original size?}
  CompareSize -- Yes --> ReturnZstd[Return Zstd type byte + compressed payload]
  CompareSize -- No --> ReturnRawFull[Return Raw type byte + raw data]
```

## Tech Stack

- **Zstandard (zstd):** High-performance compression engine linking to the official C Zstd library.
- **thiserror:** Clean and safe error modeling and transparent forwarding.
- **Standard Library Features:** `std::io::Cursor` and `zstd::stream::Decoder` for zero-allocation stream decoding.

## Directory Structure

```text
.
├── Cargo.toml
├── src/
│   ├── decode.rs
│   ├── encode.rs
│   ├── error.rs
│   └── lib.rs
└── tests/
    └── main.rs
```

## API Docs

- **encode(data: &[u8], level: Option<i32>) -> Result<Vec<u8>>**
  Compresses slice using Zstd magicless format. Automatically falls back to raw encoding if compression doesn't decrease data size.
- **decode(data: &[u8]) -> Result<Vec<u8>>**
  Decompresses envelope-encoded slice. Supports both raw and magicless zstd variants.
- **DEFAULT_LEVEL: i32**
  Default compression level (3).
- **Type**
  Type of data payload.
  - `Raw = 0`
  - `Zstd = 1`
- **Error**
  Error types.
  - `Empty`
  - `InvalidType(u8)`
  - `Zstd(std::io::Error)`
- **Result<T>**
  Convenient alias for `Result<T, Error>`.

## History & Background

Yann Collet created LZ4 in 2011 to optimize for extreme decompression speeds. In 2014, he implemented Finite State Entropy (FSE) based on Jarek Duda's Asymmetric Numeral Systems (ANS). FSE was a major breakthrough as it bridged the gap between Huffman coding's speed and arithmetic coding's compression ratio. Zstandard, released in 2016 by Facebook, integrated these concepts into a single robust tool, allowing developers to scale dynamically between speed and compression ratio. `autozstd` extends this powerful tool by resolving the "small payload expansion" problem through envelope framing.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI

---

<a id="zh"></a>

# autozstd : 基于信封模式与回退机制的高性能 Zstd 压缩

- [autozstd : 基于信封模式与回退机制的高性能 Zstd 压缩](#autozstd-基于信封模式与回退机制的高性能-zstd-压缩)
  - [项目功能介绍](#项目功能介绍)
  - [使用演示](#使用演示)
  - [特性介绍](#特性介绍)
  - [设计思路](#设计思路)
  - [技术堆栈](#技术堆栈)
  - [目录结构](#目录结构)
  - [API 说明](#api-说明)
  - [技术背景与历史故事](#技术背景与历史故事)
  - [关于](#关于)

## 项目功能介绍

基于信封模式的高性能 Rust Zstd 压缩封装库。如果压缩后的数据大小大于或等于原始大小（如小文本），则自动回退并以原始数据存储，从而保证小载荷不发生膨胀。使用原生的无魔数（magicless）配置剥离 Zstd 的 4 字节魔数头部，节省每一字节的传输带宽。

## 使用演示

```rust
  use autozstd::{encode, decode};

  let data = b"hello world".repeat(100);
  let encoded = encode(&data, None).unwrap();
  let decoded = decode(&encoded).unwrap();
  assert_eq!(decoded, data);
```

## 特性介绍

- **信封模式：** 首字节标志区分原始载荷和压缩载荷。
- **自动回退：** 若压缩后数据量反胜，自动以降级 RAW 方式存储，避免数据膨胀。
- **原生无魔数配置：** 直接指示 Zstd 忽略魔数生成与校验，在字节级别上节省传输开销。
- **单次堆内存分配：** 通过 `std::io::Cursor` 封装 `Vec` 进行偏移写入，确保整个压缩链路只有一次内存分配。
- **100% 安全：** 基于官方 C Zstd 绑定之上封装，全程 100% Safe Rust。

## 设计思路

```mermaid
graph TD
  Start[输入数据] --> CheckEmpty{是否为空?}
  CheckEmpty -- 是 --> ReturnRaw[仅返回原始类型字节]
  CheckEmpty -- 否 --> Compress[无魔数 Zstd 压缩]
  Compress --> CompareSize{压缩大小 < 原始大小?}
  CompareSize -- 是 --> ReturnZstd[返回 Zstd 类型字节 + 压缩数据]
  CompareSize -- 否 --> ReturnRawFull[返回 Raw 类型字节 + 原始数据]
```

## 技术堆栈

- **Zstandard (zstd):** 官方 Meta C Zstd 高效压缩引擎。
- **thiserror:** 规范安全的自定义错误建模。
- **标准库工具：** 利用 `std::io::Cursor` 实现偏移压缩，利用 `zstd::stream::Decoder` 实现流式解压。

## 目录结构

```text
.
├── Cargo.toml
├── src/
│   ├── decode.rs
│   ├── encode.rs
│   ├── error.rs
│   └── lib.rs
└── tests/
    └── main.rs
```

## API 说明

- **encode(data: &[u8], level: Option<i32>) -> Result<Vec<u8>>**
  使用 Zstd 无魔数格式压缩切片。若压缩未减小体积，则自动回退为原始数据存储。
- **decode(data: &[u8]) -> Result<Vec<u8>>**
  解压信封编码的切片。支持原始与无魔数 Zstd 两种模式。
- **DEFAULT_LEVEL: i32**
  默认压缩级别 (3)。
- **Type**
  载荷类型。
  - `Raw = 0`
  - `Zstd = 1`
- **Error**
  错误类型。
  - `Empty`
  - `InvalidType(u8)`
  - `Zstd(std::io::Error)`
- **Result<T>**
  `Result<T, Error>` 的简易别名。

## 技术背景与历史故事

Zstandard 的创作者 Yann Collet 最初是在为 HP 48 计算器开发游戏时接触到数据压缩的。2011 年他发布了极速解压的 LZ4。2014 年，他基于 Jarek Duda 的非对称数字系统（ANS）理论，实现了有限状态熵（FSE）。这一算法的突破在于它以接近霍夫曼编码的极高速度，实现了算术编码级别的压缩率。2016 年 Yann Collet 带着这些成果在 Facebook 发布了 Zstandard，成为了现代压缩的行业标准。`autozstd` 正是通过信封协议，解决极小数据在 Zstd 帧结构下由于帧头膨胀的问题，使该顶尖算法在微服务和网络数据包传输中更加完美。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
