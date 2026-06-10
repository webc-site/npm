import native from "./native.js";
import wrapStream from "./wrapStream.js";

export default (base_url, api_key, model) => (prompt, working_dir) =>
  wrapStream(native.run(prompt, base_url, api_key, model, working_dir));
