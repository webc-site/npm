# ireq : 极简 Rust HTTP 请求库

## 特性介绍

- 全局客户端实例：免去重复创建开销，最大化复用连接。
- 代理配置：自动检测 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 环境变量（需启用 `proxy` 特性）。
- 自动重试：针对临时性故障提供可配置的重试机制（需启用 `retry` 特性）。
- 响应校验：自动过滤成功状态码，减少手动处理逻辑。

## 使用演示

在 Cargo.toml 中添加依赖：

```toml
[dependencies]
ireq = "0.1"
tokio = { version = "1", features = ["full"] }
```

示例代码：

```rust
use ireq::{get, post, Result};

#[tokio::main]
async fn main() -> Result<()> {
  // 发送 GET 请求并获取字符串响应
  let html = get("https://www.rust-lang.org").await?;
  println!("{}", html);

  // 发送带有主体的 POST 请求
  let response = post("https://httpbin.org/post", "hello rust").await?;
  println!("{}", response);

  Ok(())
}
```

启用重试配置：

```rust
#[cfg(feature = "retry")]
{
  use ireq::retry::req;
  use std::time::Duration;
  let req_builder = ireq::REQ.get("https://www.rust-lang.org");
  let html_bytes = req(req_builder, 3, Duration::from_secs(1)).await?;
}
```

## 设计思路

```mermaid
graph TD
  A[调用 API] --> B{是否启用重试特性?}
  B -- 是 --> C["Retry::default().req / req"]
  C --> D[克隆请求并发送]
  D --> E{状态码成功且读取成功?}
  E -- 是 --> F[返回字节或字符串]
  E -- 否且状态码非 404 且 retry > 0 --> G[等待延迟并重试]
  G --> D
  E -- 否且 (状态码为 404 或 retry == 0) --> H[返回错误]
  B -- No --> I[直接发送请求]
  I --> J{状态码成功?}
  J -- Yes --> K[读取字节]
  K --> F
  J -- No --> H
```

## 技术堆栈

- 开发语言：Rust 2024
- 核心网络库：`reqwest 0.13`
- 异步运行时：`tokio 1.52` (开发依赖)
- 关键依赖：`bytes`, `const-str`, `static_init`, `thiserror`, `tokio`

## Directory Structure

```
.
├── Cargo.toml
├── README.mdt
├── src
│   ├── error.rs
│   ├── lib.rs
│   ├── proxy.rs
│   └── retry.rs
└── tests
    └── main.rs
```

## API 说明

- `Result<T>`: `Result<T, Error>` 的类型别名。
- `Error`: 错误枚举。
  - `Status(Box<reqwest::Response>)`: HTTP 异常状态码错误。
  - `Reqwest(reqwest::Error)`: 底层网络及请求错误。
- `REQ`: 全局静态 `Client` 实例，默认开启 gzip/brotli/zstd，连接超时 9 秒，请求超时 100 秒。
- `SUCCESS_STATUS`: 成功状态码数组。
- `async fn req(req: RequestBuilder) -> Result<Bytes>`: 发送 HTTP 请求并校验状态码。启用 `retry` 特性时会自动重试。
- `async fn getbin(url: impl IntoUrl) -> Result<Bytes>`: 发送 GET 请求并返回字节。
- `async fn get(url: impl IntoUrl) -> Result<String>`: 发送 GET 请求并返回字符串。
- `async fn post(url: impl IntoUrl, body: impl Into<Body>) -> Result<String>`: 发送 POST 请求。
- `async fn put(url: impl IntoUrl, body: impl Into<Body>) -> Result<String>`: 发送 PUT 请求。
- `async fn delete(url: impl IntoUrl, body: impl Into<Body>) -> Result<String>`: 发送 DELETE 请求。
- `async fn patch(url: impl IntoUrl, body: impl Into<Body>) -> Result<String>`: 发送 PATCH 请求。
- `retry` 模块（启用 `retry` 特性时可用）：
  - `Retry`: 包含重试配置的结构体。
    - `Retry::new(retry: usize, delay: Duration) -> Self`: 创建指定重试次数限制与延迟的实例。
    - `Retry::default() -> Self`: 创建读取 `IREQ_RETRY` 与 `IREQ_RETRY_DELAY` 环境变量的实例，默认重试次数为 3，延迟为 0 毫秒。
    - `req(&self, req: RequestBuilder) -> Result<Bytes>`: 使用当前配置执行请求。
  - `req(req: RequestBuilder, retry: usize, delay: Duration) -> Result<Bytes>`: 独立函数，指定重试限制与延迟执行请求。

## 历史小故事

**技术趣闻：Reqwest 的诞生**

`reqwest` 的命名源于 Python 著名库 `requests` 与 “西（west）” 的谐音组合。作者 Sean McArthur 旨在为 Rust 生态系统带来如 Python `requests` 般简单易用的 HTTP 客户端体验。时至今日，它已成为 Rust 社区中使用最广泛的 HTTP 库。而 `ireq` 则是在此基础上的进一步精简包装，专为敏捷开发设计。
