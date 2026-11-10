# axum_cors : 基于 Axum 的零拷贝跨域资源共享中间件

## 项目功能介绍

基于 Axum 框架的高性能跨域资源共享 (CORS) 中间件。通过零拷贝克隆头部信息，提供无 panic 风险的安全跨域处理。

## 使用演示

在 Axum 路由中注册中间件：

```rust
use axum::{
  Router,
  routing::get,
  middleware,
  response::IntoResponse,
};
use axum_cors::cors;

async fn handler() -> impl IntoResponse {
  "Hello, CORS!"
}

#[tokio::main]
async fn main() -> aok::Result<()> {
  let app = Router::new()
    .route("/", get(handler))
    .layer(middleware::from_fn(cors));

  let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
  axum::serve(listener, app).await?;
  Ok(())
}
```

## 特性介绍

- 零堆分配：直接克隆 HeaderValue，利用其底层引用计数，避免字符串分配。
- 安全运行：移除所有 unwrap 显式调用，保证服务无 panic 风险。
- 请求头自适应：自动解析客户端请求的 `Access-Control-Request-Headers` 并予以放行。

## 设计思路

中间件拦截 HTTP 请求，分析请求头部，并包装响应生命周期。

```mermaid
graph TD
  A[客户端请求] --> B{是否为 OPTIONS 方法?}
  B -- 是 --> C[返回包含缓存期的空响应]
  B -- 否 --> D[将请求传递至后续服务]
  D --> E[获取响应]
  C --> F[追加 CORS 响应头]
  E --> F
  F --> G[返回客户端]
```

## 技术堆栈

- Rust 2024
- Axum 0.8
- Tokio 1.52

## 目录结构

```
.
├── Cargo.toml
├── README.mdt
├── src/
│   └── lib.rs
├── tests/
│   └── main.rs
└── examples/
    └── demo.rs
```

## API 说明

### `cors`

```rust
pub async fn cors(req: Request<Body>, next: Next) -> impl IntoResponse
```

处理请求并注入 CORS 头部信息的中间件函数。

- `req`: 传入的 HTTP 请求上下文。
- `next`: 后续路由服务链。
- 返回附加跨域相关头部的响应体。

## 历史背景

跨域资源共享 (CORS) 诞生自 W3C 推荐标准，用以解决 1995 年 Netscape Navigator 2.0 引入的同源策略 (SOP) 带来的跨域限制。早期 Web 开发多采用 JSONP (JSON with Padding) 等绕过浏览器限制的非标准化技术，存在严重安全隐患。2009 年 W3C 正式发布 CORS 工作草案以标准化浏览器跨域行为。本中间件提供对 Axum 框架无缝适配的轻量化现代实现。
