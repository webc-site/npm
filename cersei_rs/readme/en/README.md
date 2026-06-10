# cersei_rs

N-API wrapper for Cersei, providing agent creation and streaming chat session functionality in Node.js.

## Installation

```bash
npm install cersei_rs
```

## API Usage

### Constants

This module exports the following event type constants to identify the type of data in the stream:

- `MSG_TXT` (1): Streaming text content event.
- `MSG_TOOL` (2): Tool execution start event.
- `MSG_END` (3): Task completion event.
- `MSG_ERR` (4): Error occurred event.

### chat (Default Export)

Creates a stateless agent function.

```javascript
import chat, { MSG_TXT, MSG_TOOL } from "cersei_rs";

const agent = chat(baseUrl, apiKey, model);

// Run task and stream events
const prompt = "Write a programmer joke in tmp.md";
const workingDir = "./gen";

for await (const [type, content] of agent(prompt, workingDir)) {
  switch (type) {
    case MSG_TXT:
      process.stdout.write(content);
      break;
    case MSG_TOOL:
      console.log(`\n[Tool Start]: ${content}`);
      break;
  }
}
```

### session

Creates an agent function that maintains chat history in a session context.

```javascript
import { session, MSG_TXT } from "cersei_rs";

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
