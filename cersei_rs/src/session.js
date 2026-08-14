import native from "./native.js";
import wrapStream from "./wrapStream.js";

export default (base_url, api_key, model, working_dir, history = null) => {
  const s = new native.AgentSession(base_url, api_key, model, working_dir, history);
  return (prompt) => wrapStream(s.chat(prompt));
};
