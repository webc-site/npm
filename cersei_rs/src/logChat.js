import chat from "./chat.js";
import log from "./log.js";

export default (base_url, api_key, model) => {
  const c = chat(base_url, api_key, model);
  return async (prompt, working_dir) => log(c(prompt, working_dir));
};
