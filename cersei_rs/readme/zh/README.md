# cersei_rs

Cersei 的 N-API 包装器，为 Node.js 环境提供智能体创建和流式对话会话功能。

## 安装

```bash
npm install cersei_rs
```

## API 使用说明

### 常量定义
- `MSG_TXT` (1): 文本内容流式输出事件。
- `MSG_TOOL` (2): 工具执行启动事件。
- `MSG_END` (3): 任务完成事件。
- `MSG_ERR` (4): 异常错误事件。

### createAgent
创建一个无状态的智能体执行函数。

```javascript
import { createAgent, MSG_TXT, MSG_TOOL } from 'cersei_rs';

const agent = createAgent(baseUrl, apiKey, model);

// 运行任务并以流式获取事件
const prompt = "在 tmp.md 中写一个程序员的笑话";
const workingDir = "./gen";

for await (const [type, content] of agent(prompt, workingDir)) {
  switch (type) {
    case MSG_TXT:
      process.stdout.write(content);
      break;
    case MSG_TOOL:
      console.log(`\n[工具启动]: ${content}`);
      break;
  }
}
```

### ChatSession
在会话上下文中维护对话历史。

```javascript
import { ChatSession, MSG_TXT } from 'cersei_rs';

const history = [
  { role: "user", content: "记住我的名字叫 Cersei" },
  { role: "assistant", content: "好的，我已经记住了，您的名字是 Cersei。" },
];

const session = new ChatSession(baseUrl, apiKey, model, "./gen", history);

for await (const [type, content] of session.chat("我的名字叫什么？")) {
  if (type === MSG_TXT) {
    process.stdout.write(content);
  }
}
```

## 开源协议

MulanPSL-2.0
