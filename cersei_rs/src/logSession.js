import session from "./session.js";
import log from "./log.js";

export default (base_url, api_key, model, working_dir, history = null) => {
  const s = session(base_url, api_key, model, working_dir, history);
  return async (prompt) => log(s(prompt));
};
