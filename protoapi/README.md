[English](#en) | [中文](#zh)

---

<a id="en"></a>
# @1-/protoapi : High-performance binary protocol for browsers

- [@1-/protoapi : High-performance binary protocol for browsers](#1-protoapi-high-performance-binary-protocol-for-browsers)
  - [Functionality](#functionality)
  - [Usage demonstration](#usage-demonstration)
  - [Design rationale](#design-rationale)
  - [Technology stack](#technology-stack)
  - [Code structure](#code-structure)
  - [Historical context](#historical-context)
  - [About](#about)

## Functionality

ProtoAPI enables efficient, low-overhead communication between web clients and backend services. Core mechanisms include: automatic request batching, automatic captcha challenge retry, unified error status dispatch, and binary data serialization/deserialization. The protocol is Protocol Buffers-style, using varint encoding and UTF-8 string encoding.

## Usage demonstration

```bash
npm install @1-/protoapi
```

```javascript
import { req, setApi, setOnCaptcha, setOnErr, setCaptcha, setFetch } from "@1-/protoapi";
import { string } from "@1-/proto/E.js";
import { uint64 } from "@1-/proto/D.js";

// Configure API endpoint
setApi("https://api.example.com/v1");

// Handle captcha challenges
setOnCaptcha(async () => {
  // Implement captcha resolution logic, return token
  return await resolveCaptcha();
});

// Handle error responses
setOnErr((error) => {
  console.error("API error:", error);
});

// Set precomputed captcha token (optional)
setCaptcha("precomputed-token");

// Replace fetch function (optional; must return Promise<Response>)
setFetch(customFetchFunction);

// Create request function for 'auth' service
const authReq = req("auth");

// Issue field 1 request with proto encoding and decoding functions
const login = authReq(1, [string], [uint64], "test@mail.com");

// Execute request
const userId = await login();
```

## Design rationale

ProtoAPI implements request batching via an in-memory queue and timer-based flushing. All requests are held in the queue and merged into a single HTTP POST after a 1ms delay. Server responses are parsed by ID and status code in a streaming fashion and dispatched to corresponding Promises.

```mermaid
graph TD
  A["Client Application"] --> B["Call req(mod) to create request function"]
  B --> C["Call request function to generate Promise"]
  C --> D["UTF-8 encode module name (with \0 terminator)"]
  D --> E["Varint encode field number and arguments"]
  E --> F["Append to in-memory request queue"]
  F --> G["1ms after queue insertion"]
  G --> H["HTTP POST Request"]
  H --> I["Server Response"]
  I --> J["Streaming binary parsing"]
  J --> K["Status dispatch"]
  K -->|OK| L["Promise resolution"]
  K -->|ERR| M["Invoke setOnErr"]
  K -->|CAPTCHA| N["Invoke setOnCaptcha and retry"]
```

## Technology stack

- Core runtime: Modern JavaScript (ES modules, `Uint8Array`)
- Binary codecs: `@1-/proto/E.js` (encoder), `@1-/proto/D.js` (decoder)
- UTF-8 codecs: `@3-/utf8/utf8e.js` (encoder), `@3-/utf8/utf8d.js` (decoder)
- Network layer: Standard `fetch` API, fully replaceable (must return `Promise<Response>`)
- Protocol format: Protocol Buffers-style binary frames

## Code structure

```
src/
├── _.js          # Main implementation (135 lines)
│   ├── Binary utilities: callBin (field packing), reqChunk (request frame construction)
│   ├── Batching system: REQ_LI (request queue), send (flush function), TIMER (setTimeout timer)
│   ├── Response parsing: resIter (generator for streaming response parsing)
│   ├── Captcha handling: ON_CAPTCHA (callback), CAPTCHA_TOKEN (Pragma header value)
│   ├── API interface: req (module name binding factory), sendReq (low-level request function)
│   └── Global configuration: setApi, setOnCaptcha, setOnErr, setCaptcha, setFetch
└── STATUS.js     # Status constants (OK=0, ERR=1, CAPTCHA=2)
```

## Historical context

Compact binary protocol design originated with IBM's Systems Network Architecture (SNA) in the 1970s, first deployed at scale in enterprise networks. Google open-sourced Protocol Buffers in 2008, establishing this paradigm in distributed systems and demonstrating 3–10x smaller payloads compared to JSON. ProtoAPI inherits this legacy, optimized for browser environments with integrated batching and captcha workflows.


## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# @1-/protoapi : 浏览器端高效二进制协议

- [@1-/protoapi : 浏览器端高效二进制协议](#1-protoapi-浏览器端高效二进制协议)
  - [功能介绍](#功能介绍)
  - [使用演示](#使用演示)
  - [设计思路](#设计思路)
  - [技术栈](#技术栈)
  - [代码结构](#代码结构)
  - [历史故事](#历史故事)
  - [关于](#关于)

## 功能介绍

ProtoAPI 实现 Web 客户端与后端服务的高效、低开销通信。核心机制包括：请求自动批处理、验证码挑战自动重试、错误状态统一分发、二进制数据序列化与反序列化。协议采用 Protocol Buffers 风格，使用 varint 编码和 UTF-8 字符串编码。

## 使用演示

```bash
npm install @1-/protoapi
```

```javascript
import { req, setApi, setOnCaptcha, setOnErr, setCaptcha, setFetch } from "@1-/protoapi";
import { string } from "@1-/proto/E.js";
import { uint64 } from "@1-/proto/D.js";

// 配置 API 端点
setApi("https://api.example.com/v1");

// 处理验证码挑战
setOnCaptcha(async () => {
  // 实现验证码解析逻辑，返回令牌
  return await resolveCaptcha();
});

// 处理错误响应
setOnErr((error) => {
  console.error("API 错误:", error);
});

// 设置预计算的验证码令牌（可选）
setCaptcha("precomputed-token");

// 替换 fetch 函数（可选）
setFetch(customFetchFunction);

// 创建 'auth' 服务的请求函数
const authReq = req("auth");

// 发起字段 1 请求，使用 proto 编码与解码函数
const login = authReq(1, [string], [uint64], "test@mail.com");

// 执行请求
const userId = await login();
```

## 设计思路

ProtoAPI 通过内存队列与定时刷新实现请求批处理。所有请求暂存于队列，1 毫秒后合并为单个 HTTP POST 请求。服务器响应按 ID 和状态码流式解析，并分发至对应 Promise。

```mermaid
graph TD
  A["客户端应用"] --> B["调用 req(mod) 创建请求函数"]
  B --> C["调用请求函数生成 Promise"]
  C --> D["UTF-8 编码模块名（含\0终止符）"]
  D --> E["Varint 编码字段号与参数"]
  E --> F["加入内存请求队列"]
  F --> G["1ms 后触发批量发送"]
  G --> H["HTTP POST 请求"]
  H --> I["服务器响应"]
  I --> J["二进制流式解析"]
  J --> K["状态分发"]
  K -->|OK| L["Promise 解析"]
  K -->|ERR| M["调用 setOnErr"]
  K -->|CAPTCHA| N["调用 setOnCaptcha 并重试"]
```

## 技术栈

- 核心运行时：现代 JavaScript（ES 模块，`Uint8Array`）
- 二进制编解码：`@1-/proto/E.js`（编码器）、`@1-/proto/D.js`（解码器）
- UTF-8 编解码：`@3-/utf8/utf8e.js`（编码器）、`@3-/utf8/utf8d.js`（解码器）
- 网络层：标准 `fetch` API，完全可替换（需返回 `Promise<Response>`）
- 协议格式：Protocol Buffers 风格二进制帧

## 代码结构

```
src/
├── _.js          # 主实现（135 行）
│   ├── 二进制工具：callBin（字段打包）、reqChunk（请求帧构造）
│   ├── 批处理系统：REQ_LI（请求队列）、send（刷新函数）、TIMER（`setTimeout` 定时器）
│   ├── 响应解析：resIter（生成器，流式解析响应）
│   ├── 验证码处理：ON_CAPTCHA（回调）、CAPTCHA_TOKEN（`Pragma` 请求头值）
│   ├── API 接口：req（模块名绑定工厂）、sendReq（底层请求函数）
│   └── 全局配置：setApi、setOnCaptcha、setOnErr、setCaptcha、setFetch
└── STATUS.js     # 状态常量（OK=0, ERR=1, CAPTCHA=2）
```

## 历史故事

紧凑二进制协议设计始于 1970 年代 IBM 的系统网络体系结构（SNA），首次在企业级网络中大规模部署。2008 年 Google 开源 Protocol Buffers，确立该范式在分布式系统中的地位，并证实其相比 JSON 可减少 3–10 倍传输体积。ProtoAPI 继承此传统，专为浏览器环境优化，集成批处理与验证码工作流。


## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

