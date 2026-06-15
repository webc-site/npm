[English](#en) | [中文](#zh)

---

<a id="en"></a>
# cersei_rs

- [cersei_rs](#cersei_rs)
  - [Installation](#installation)
  - [API Usage](#api-usage)
    - [Constants](#constants)
    - [logChat (Default Export)](#logchat-default-export)
    - [logSession](#logsession)
    - [chat](#chat)
    - [session](#session)
  - [License](#license)
  - [About](#about)

N-API wrapper for Cersei, providing agent creation, streaming chat session, and logging functionality in Node.js.

## Installation

```bash
npm install cersei_rs
```

## API Usage

### Constants

Import constants from `"cersei_rs/MSG"` to identify event types in the stream:

- `MSG_ERR` (1): Error occurred.
- `MSG_TOOL` (2): Tool execution started.
- `MSG_TXT` (3): Streaming text content.
- `MSG_THINK` (4): Streaming thinking process.

### logChat (Default Export)

Wrapper function that automatically logs agent execution (thinking process, tool calls, and output text) to `stdout` and returns a Promise resolving to the final accumulated text response.

```javascript
import logChat from "cersei_rs";

const agent = logChat(baseUrl, apiKey, model);
const response = await agent("Write a programmer joke in tmp.md", "./gen");
console.log("\nResponse:", response);
```

### logSession

Wrapper function that automatically logs agent execution for a session maintaining chat history, returning a function that yields a Promise resolving to the final accumulated text response.

```javascript
import logSession from "cersei_rs/logSession";

const history = [
  { role: "user", content: "Remember my name is Cersei" },
  { role: "assistant", content: "Got it, I'll remember that your name is Cersei." },
];

const chatSession = logSession(baseUrl, apiKey, model, "./gen", history);
const response = await chatSession("What is my name?");
console.log("\nResponse:", response);
```

### chat

Creates a stateless agent function that returns an async generator streaming events.

```javascript
import chat from "cersei_rs/chat";
import { MSG_TXT, MSG_TOOL } from "cersei_rs/MSG";

const agent = chat(baseUrl, apiKey, model);

// Run task and stream events
const prompt = "Write a programmer joke in tmp.md";
const workingDir = "./gen";

for await (const [type, content, args] of agent(prompt, workingDir)) {
  switch (type) {
    case MSG_TXT:
      process.stdout.write(content);
      break;
    case MSG_TOOL:
      console.log(`\n[Tool]: ${content} ${args || ""}`);
      break;
  }
}
```

### session

Creates an agent session that maintains chat history, returning a function that yields streaming events.

```javascript
import session from "cersei_rs/session";
import { MSG_TXT } from "cersei_rs/MSG";

const history = [
  { role: "user", content: "Remember my name is Cersei" },
  { role: "assistant", content: "Got it, I'll remember that your name is Cersei." },
];

const chatSession = session(baseUrl, apiKey, model, "./gen", history);

for await (const [type, content] of chatSession("What is my name?")) {
  if (type === MSG_TXT) {
    process.stdout.write(content);
  }
}
```

## License

MulanPSL-2.0


## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# cersei_rs

- [cersei_rs](#cersei_rs)
  - [安装](#安装)
  - [API 使用说明](#api-使用说明)
    - [常量定义](#常量定义)
    - [logChat (默认导出)](#logchat-默认导出)
    - [logSession](#logsession)
    - [chat](#chat)
    - [session](#session)
  - [开源协议](#开源协议)
  - [关于](#关于)

Cersei 的 N-API 包装器，为 Node.js 环境提供智能体创建、流式对话会话，以及自动日志记录功能。

## 安装

```bash
npm install cersei_rs
```

## API 使用说明

### 常量定义

从 `"cersei_rs/MSG"` 导入常量以识别流式输出中的事件类型：

- `MSG_ERR` (1): 异常错误事件。
- `MSG_TOOL` (2): 工具执行启动事件。
- `MSG_TXT` (3): 文本内容流式输出事件。
- `MSG_THINK` (4): 思考过程流式输出事件。

### logChat (默认导出)

包装函数，能自动向 `stdout` 打印智能体执行日志（包含思考过程、工具调用和文本输出），并返回 Promise 解析为最终累积的文本响应。

```javascript
import logChat from "cersei_rs";

const agent = logChat(baseUrl, apiKey, model);
const response = await agent("在 tmp.md 中写一个程序员的笑话", "./gen");
console.log("\n响应:", response);
```

### logSession

包装函数，能自动向 `stdout` 打印维护对话历史的智能体执行日志，并返回 Promise 解析为最终累积的文本响应。

```javascript
import logSession from "cersei_rs/logSession";

const history = [
  { role: "user", content: "记住我的名字叫 Cersei" },
  { role: "assistant", content: "好的，我已经记住了，您的名字是 Cersei。" },
];

const chatSession = logSession(baseUrl, apiKey, model, "./gen", history);
const response = await chatSession("我的名字叫什么？");
console.log("\n响应:", response);
```

### chat

创建一个无状态的智能体执行函数，返回一个流式事件的异步生成器。

```javascript
import chat from "cersei_rs/chat";
import { MSG_TXT, MSG_TOOL } from "cersei_rs/MSG";

const agent = chat(baseUrl, apiKey, model);

// 运行任务并以流式获取事件
const prompt = "在 tmp.md 中写一个程序员的笑话";
const workingDir = "./gen";

for await (const [type, content, args] of agent(prompt, workingDir)) {
  switch (type) {
    case MSG_TXT:
      process.stdout.write(content);
      break;
    case MSG_TOOL:
      console.log(`\n[工具]: ${content} ${args || ""}`);
      break;
  }
}
```

### session

创建一个在会话上下文中维护对话历史的智能体函数，返回一个流式事件的异步生成器。

```javascript
import session from "cersei_rs/session";
import { MSG_TXT } from "cersei_rs/MSG";

const history = [
  { role: "user", content: "记住我的名字叫 Cersei" },
  { role: "assistant", content: "好的，我已经记住了，您的名字是 Cersei。" },
];

const chatSession = session(baseUrl, apiKey, model, "./gen", history);

for await (const [type, content] of chatSession("我的名字叫什么？")) {
  if (type === MSG_TXT) {
    process.stdout.write(content);
  }
}
```

## 开源协议

MulanPSL-2.0


## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

