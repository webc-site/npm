# cersei_rs

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
  { role: "assistant", content: "Got it, I'll remember that your name is Cersei." }
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
  { role: "assistant", content: "Got it, I'll remember that your name is Cersei." }
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
