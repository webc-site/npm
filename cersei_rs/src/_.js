import { createRequire } from "node:module";
import PLATFORM from "./PLATFORM.js";

const require = createRequire(import.meta.url),
  native = require("../npm/" + PLATFORM),
  wrapStream = (stream) => {
    stream[Symbol.asyncIterator] = () => ({
      next: async () => {
        const val = await stream.next();
        return val === null || val === undefined
          ? { value: undefined, done: true }
          : { value: val, done: false };
      },
    });
    return stream;
  },
  chat = (base_url, api_key, model) => (prompt, working_dir) =>
    wrapStream(native.run(prompt, base_url, api_key, model, working_dir));

export const MSG_TXT = 1,
  MSG_TOOL = 2,
  MSG_END = 3,
  MSG_ERR = 4,
  session = (base_url, api_key, model, working_dir, history = null) => {
    const s = new native.AgentSession(base_url, api_key, model, working_dir, history);
    return (prompt) => wrapStream(s.chat(prompt));
  };

export default chat;
