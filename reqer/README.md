[English](#en) | [中文](#zh)

---

<a id="en"></a>
# reqer : Unified cross-platform HTTP client for native and WebAssembly

- [reqer : Unified cross-platform HTTP client for native and WebAssembly](#reqer-unified-cross-platform-http-client-for-native-and-webassembly)
  - [Overview](#overview)
  - [Features](#features)
  - [Usage](#usage)
  - [Design](#design)
  - [Tech Stack](#tech-stack)
  - [Directory Structure](#directory-structure)
  - [API Documentation](#api-documentation)
    - [Free Functions](#free-functions)
    - [`Client`](#client)
    - [`RequestBuilder`](#requestbuilder)
    - [`Response`](#response)
    - [`Method`](#method)
    - [`Error` & `Result`](#error-result)
  - [Historical Trivia](#historical-trivia)
  - [About](#about)

## Overview

reqer provides unified, asynchronous HTTP client interfaces across native targets and WebAssembly environments.

On native targets, reqer wraps reqwest with rustls support for high-throughput network operations.

On WebAssembly browser targets, reqer delegates network requests to the browser Fetch API via gloo-net.

## Features

- Cross-platform consistency: Uniform request construction and response parsing across native and WebAssembly targets.
- Zero-overhead abstraction: Conditional compilation eliminates runtime routing penalties.
- Ergonomic builder pattern: Method chaining for headers, body payloads, and HTTP verbs.
- Direct helper functions: Instant request execution via top-level functions without manual client instantiation.

## Usage

Add reqer to Cargo.toml:

```toml
[dependencies]
reqer = "0.1"
tokio = { version = "1", features = ["full"] }
```

Send GET request and inspect response:

```rust
use reqer::{Result, get};

#[tokio::main]
async fn main() -> Result<()> {
  let res = get("https://httpbin.org/get")
    .header("User-Agent", "reqer-demo")
    .send()
    .await?;

  if res.is_success() {
    let body = res.text().await?;
    println!("{body}");
  }

  Ok(())
}
```

Reuse Client instance for multiple requests:

```rust
use bytes::Bytes;
use reqer::{Client, Result};

#[tokio::main]
async fn main() -> Result<()> {
  let client = Client::new();

  let res = client
    .post("https://httpbin.org/post")
    .header("Content-Type", "application/json")
    .body(Bytes::from_static(b"{\"key\": \"value\"}"))
    .send()
    .await?;

  println!("Status: {}", res.status());
  let bytes = res.bytes().await?;
  println!("Received bytes: {}", bytes.len());

  Ok(())
}
```

## Design

```mermaid
graph TD
  A[Client / Free Function] --> B[RequestBuilder]
  B --> C{Target Architecture}
  C -- not wasm32 --> D[reqwest Client / RequestBuilder]
  C -- wasm32 --> E[gloo-net http Request]
  D --> F[Rustls Network Transport]
  E --> G[Browser Fetch API]
  F --> H[Response Wrapper]
  G --> H
  H --> I[Status Inspection / Bytes / Text Output]
```

## Tech Stack

- Language: Rust 2024
- Native HTTP Backend: `reqwest 0.13` (rustls)
- WebAssembly HTTP Backend: `gloo-net 0.7`, `js-sys 0.3`
- Data Buffer: `bytes 1.12`
- Error Definition: `thiserror 2.0`

## Directory Structure

```
.
├── Cargo.toml
├── README.md
├── README.mdt
├── readme
│   ├── en.md
│   └── zh.md
├── src
│   ├── client.rs
│   ├── error.rs
│   ├── lib.rs
│   ├── request.rs
│   └── response.rs
└── tests
    └── main.rs
```

## API Documentation

### Free Functions

- `get(url: impl AsRef<str>) -> RequestBuilder`: Initiates GET request builder.
- `post(url: impl AsRef<str>) -> RequestBuilder`: Initiates POST request builder.
- `put(url: impl AsRef<str>) -> RequestBuilder`: Initiates PUT request builder.
- `delete(url: impl AsRef<str>) -> RequestBuilder`: Initiates DELETE request builder.
- `patch(url: impl AsRef<str>) -> RequestBuilder`: Initiates PATCH request builder.
- `head(url: impl AsRef<str>) -> RequestBuilder`: Initiates HEAD request builder.

### `Client`

HTTP client struct managing reusable connections on native platforms.

- `Client::new() -> Self`: Creates client instance.
- `client.get(url: impl AsRef<str>) -> RequestBuilder`: Builds GET request.
- `client.post(url: impl AsRef<str>) -> RequestBuilder`: Builds POST request.
- `client.put(url: impl AsRef<str>) -> RequestBuilder`: Builds PUT request.
- `client.delete(url: impl AsRef<str>) -> RequestBuilder`: Builds DELETE request.
- `client.patch(url: impl AsRef<str>) -> RequestBuilder`: Builds PATCH request.
- `client.head(url: impl AsRef<str>) -> RequestBuilder`: Builds HEAD request.
- `client.req(method: Method, url: impl AsRef<str>) -> RequestBuilder`: Builds request with specified HTTP method.

### `RequestBuilder`

Request configuration builder.

- `header(key: impl AsRef<str>, val: impl AsRef<str>) -> Self`: Appends single HTTP header.
- `headers(iter: impl IntoIterator<Item = (K, V)>) -> Self`: Appends collection of HTTP headers.
- `body(body: impl Into<Bytes>) -> Self`: Sets request payload body.
- `async fn send(self) -> Result<Response>`: Dispatches HTTP request asynchronously.

### `Response`

Unified response wrapper across targets.

- `status(&self) -> u16`: Returns HTTP status code number.
- `is_success(&self) -> bool`: Checks if status code falls within 200..299.
- `is_client_error(&self) -> bool`: Checks if status code falls within 400..499.
- `is_server_error(&self) -> bool`: Checks if status code falls within 500..599.
- `error_for_status(self) -> Result<Self>`: Validates status code, returning `Error::Status` if client or server error.
- `async fn bytes(self) -> Result<Bytes>`: Reads response body as `Bytes`.
- `async fn text(self) -> Result<String>`: Reads response body as `String`.

### `Method`

Enum representing HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`.

### `Error` & `Result`

- `Result<T>`: Type alias for `std::result::Result<T, Error>`.
- `Error`: Enum covering `Http` (wrapped reqwest or gloo-net error), `Status(u16, String)`, and `Header`.

## Historical Trivia

**The Evolution from Line Protocol to WebAssembly Fetch**

In 1991, Tim Berners-Lee specified HTTP/0.9 as a single-line ASCII protocol: clients sent only `GET /path` followed by a newline, and servers returned raw hypertext before closing the connection. Headers, status codes, and body payloads did not exist.

Over three decades later, modern web computing spans server clusters and browser runtimes. Rust applications targeting WebAssembly cannot access raw TCP sockets directly due to browser sandbox constraints, relying instead on the asynchronous JavaScript Fetch API. Libraries like `reqer` bridge native socket-level networking and browser Fetch implementations, allowing identical client code to run across diverse target environments.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# reqer : 跨平台原生与 WebAssembly 统一 HTTP 客户端

- [reqer : 跨平台原生与 WebAssembly 统一 HTTP 客户端](#reqer-跨平台原生与-webassembly-统一-http-客户端)
  - [项目功能介绍](#项目功能介绍)
  - [特性介绍](#特性介绍)
  - [使用演示](#使用演示)
  - [设计思路](#设计思路)
  - [技术堆栈](#技术堆栈)
  - [目录结构](#目录结构)
  - [API 说明](#api-说明)
    - [顶层快捷函数](#顶层快捷函数)
    - [`Client` 结构体](#client-结构体)
    - [`RequestBuilder` 结构体](#requestbuilder-结构体)
    - [`Response` 结构体](#response-结构体)
    - [`Method` 枚举](#method-枚举)
    - [`Error` 枚举与 `Result` 类型别名](#error-枚举与-result-类型别名)
  - [历史小故事](#历史小故事)
  - [关于](#关于)

## 项目功能介绍

reqer 提供跨平台统一异步 HTTP 客户端接口。

原生平台编译时，底层基于 reqwest 与 rustls 实现高吞吐网络通信。

WebAssembly 浏览器环境编译时，底层通过 gloo-net 桥接调用浏览器 Fetch 接口。

## 特性介绍

- 跨平台一致：原生平台与 WebAssembly 共享相同 API 设计。
- 零运行时损耗：借助编译期条件编译分发，无额外动态路由开销。
- 链式请求构建：支持链式配置请求头、请求体与请求方法。
- 快捷函数支持：提供顶层快捷函数，无需手动初始化客户端即可发起请求。

## 使用演示

在 Cargo.toml 中添加依赖：

```toml
[dependencies]
reqer = "0.1"
tokio = { version = "1", features = ["full"] }
```

发送 GET 请求并解析响应：

```rust
use reqer::{Result, get};

#[tokio::main]
async fn main() -> Result<()> {
  let res = get("https://httpbin.org/get")
    .header("User-Agent", "reqer-demo")
    .send()
    .await?;

  if res.is_success() {
    let body = res.text().await?;
    println!("{body}");
  }

  Ok(())
}
```

复用客户端实例发送 POST 请求：

```rust
use bytes::Bytes;
use reqer::{Client, Result};

#[tokio::main]
async fn main() -> Result<()> {
  let client = Client::new();

  let res = client
    .post("https://httpbin.org/post")
    .header("Content-Type", "application/json")
    .body(Bytes::from_static(b"{\"key\": \"value\"}"))
    .send()
    .await?;

  println!("Status: {}", res.status());
  let bytes = res.bytes().await?;
  println!("Received bytes: {}", bytes.len());

  Ok(())
}
```

## 设计思路

```mermaid
graph TD
  A[Client 客户端 / 顶层函数] --> B[RequestBuilder 请求构建器]
  B --> C{目标架构分发}
  C -- 非 wasm32 原生环境 --> D[reqwest 客户端 / 请求构建]
  C -- wasm32 网页装载环境 --> E[gloo-net 请求对象]
  D --> F[Rustls 安全传输层通信]
  E --> G[浏览器 Fetch 接口]
  F --> H[Response 响应包装层]
  G --> H
  H --> I[状态码检验 / 字节流或文本读取]
```

## 技术堆栈

- 编程语言：Rust 2024
- 原生端核心库：`reqwest 0.13` (rustls)
- WebAssembly 端核心库：`gloo-net 0.7`、`js-sys 0.3`
- 数据载荷：`bytes 1.12`
- 错误定义：`thiserror 2.0`

## 目录结构

```
.
├── Cargo.toml
├── README.md
├── README.mdt
├── readme
│   ├── en.md
│   └── zh.md
├── src
│   ├── client.rs
│   ├── error.rs
│   ├── lib.rs
│   ├── request.rs
│   └── response.rs
└── tests
    └── main.rs
```

## API 说明

### 顶层快捷函数

- `get(url: impl AsRef<str>) -> RequestBuilder`: 创建 GET 请求构建器。
- `post(url: impl AsRef<str>) -> RequestBuilder`: 创建 POST 请求构建器。
- `put(url: impl AsRef<str>) -> RequestBuilder`: 创建 PUT 请求构建器。
- `delete(url: impl AsRef<str>) -> RequestBuilder`: 创建 DELETE 请求构建器。
- `patch(url: impl AsRef<str>) -> RequestBuilder`: 创建 PATCH 请求构建器。
- `head(url: impl AsRef<str>) -> RequestBuilder`: 创建 HEAD 请求构建器。

### `Client` 结构体

HTTP 客户端结构体，原生端复用内部连接。

- `Client::new() -> Self`: 创建客户端实例。
- `client.get(url: impl AsRef<str>) -> RequestBuilder`: 创建 GET 请求构建器。
- `client.post(url: impl AsRef<str>) -> RequestBuilder`: 创建 POST 请求构建器。
- `client.put(url: impl AsRef<str>) -> RequestBuilder`: 创建 PUT 请求构建器。
- `client.delete(url: impl AsRef<str>) -> RequestBuilder`: 创建 DELETE 请求构建器。
- `client.patch(url: impl AsRef<str>) -> RequestBuilder`: 创建 PATCH 请求构建器。
- `client.head(url: impl AsRef<str>) -> RequestBuilder`: 创建 HEAD 请求构建器。
- `client.req(method: Method, url: impl AsRef<str>) -> RequestBuilder`: 根据指定方法创建请求构建器。

### `RequestBuilder` 结构体

请求参数构建结构体。

- `header(key: impl AsRef<str>, val: impl AsRef<str>) -> Self`: 设置键值对请求头。
- `headers(iter: impl IntoIterator<Item = (K, V)>) -> Self`: 批量设置请求头。
- `body(body: impl Into<Bytes>) -> Self`: 设置请求载荷内容。
- `async fn send(self) -> Result<Response>`: 异步发送网络请求。

### `Response` 结构体

跨平台统一响应结构体。

- `status(&self) -> u16`: 获取 HTTP 状态码。
- `is_success(&self) -> bool`: 判断状态码是否属于 200..299 成功区间。
- `is_client_error(&self) -> bool`: 判断状态码是否属于 400..499 客户端错误区间。
- `is_server_error(&self) -> bool`: 判断状态码是否属于 500..599 服务端错误区间。
- `error_for_status(self) -> Result<Self>`: 校验状态码，若为客户端或服务端错误返回 `Error::Status`。
- `async fn bytes(self) -> Result<Bytes>`: 读取响应体原始字节。
- `async fn text(self) -> Result<String>`: 读取响应体文本字符串。

### `Method` 枚举

HTTP 请求方法枚举，包含 `GET`、`POST`、`PUT`、`DELETE`、`PATCH`、`HEAD`。

### `Error` 枚举与 `Result` 类型别名

- `Result<T>`: `std::result::Result<T, Error>` 的类型别名。
- `Error`: 错误枚举，包含 `Http`（底层网络错误）、`Status(u16, String)`（状态码异常）、`Header`（请求头格式错误）。

## 历史小故事

**从单行协议到浏览器沙箱网络**

1991 年 Tim Berners-Lee 提出 HTTP/0.9 规范，设计极其简约，仅包含单行 ASCII 指令：客户端发出 `GET /路径` 并回车换行，服务端即直接返回超文本数据并关闭连接，当时尚无状态码、请求头与多媒体载荷机制。

三十余年后，现代计算环境扩展至浏览器端 WebAssembly 沙箱。浏览器环境出于安全考量限制底层 TCP 套接字直连，强制经由异步 Fetch 接口收发请求。`reqer` 统一原生网络调用与浏览器环境接口，使 Rust 应用在不同运行平台具备统一的 HTTP 请求体验。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

