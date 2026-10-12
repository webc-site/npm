# cersei_rs

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
  { role: "assistant", content: "好的，我已经记住了，您的名字是 Cersei。" }
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
  { role: "assistant", content: "好的，我已经记住了，您的名字是 Cersei。" }
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
