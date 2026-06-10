import { join } from "node:path";
import log from "@3-/log";
import read from "@3-/read";
import rJson from "@3-/read/rJson.js";
import chat, { MSG_TXT, MSG_TOOL } from "cersei_rs";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

const llmConfig = async () => {
  const path = join(homedir(), ".config", "OPENAI.js");
  if (existsSync(path)) {
    const config = (await import(path)).default;
    if (Array.isArray(config) && config.length >= 3) {
      return config; // [baseUrl, apiKey, model]
    }
  }
  throw new Error(
    "Unable to locate LLM configuration at " +
      path +
      ". The file must export default [ baseUrl, apiKey, model ].",
  );
};

export default async (pkg_path) => {
  const pkg_json_path = join(pkg_path, "package.json"),
    pkg_json = rJson(pkg_json_path),
    { description, keywords } = pkg_json,
    has_description = description && description.trim() !== "",
    has_keywords = Array.isArray(keywords) && keywords.length > 0,
    readme_prompt_path = join(import.meta.dirname, "prompt", "readme.md");
  let prompt_text = read(readme_prompt_path).trim();

  if (!has_description || !has_keywords) {
    const package_prompt_path = join(import.meta.dirname, "prompt", "package.md"),
      package_prompt = read(package_prompt_path).trim();
    prompt_text += "\n\n" + package_prompt;
  }

  log("正在通过 cersei 生成 README...");

  const [baseUrl, apiKey, model] = await llmConfig(),
    agent = chat(baseUrl, apiKey, model);

  for await (const [type, content] of agent(prompt_text, pkg_path)) {
    if (type === MSG_TXT) {
      process.stdout.write(content);
    } else if (type === MSG_TOOL) {
      console.log("\n[Tool]: " + content);
    } else if (type === 4) {
      // MSG_ERR
      throw new Error(content);
    }
  }
};
