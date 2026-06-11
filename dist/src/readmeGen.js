import { join } from "node:path";
import log from "@3-/log";
import read from "@3-/read";
import rJson from "@3-/read/rJson.js";
import logChat from "cersei_rs";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

const llmConfig = async () => {
  const path = join(homedir(), ".config", "OPENAI.js");
  if (existsSync(path)) {
    const { default: config } = await import(path);
    if (Array.isArray(config) && config.length >= 3) {
      return config; // [base_url, api_key, model]
    }
  }
  throw new Error(
    "Unable to locate LLM configuration at " +
      path +
      ". The file must export default [ base_url, api_key, model ].",
  );
};

export default async (pkg_path) => {
  const json_path = join(pkg_path, "package.json"),
    pkg_json = rJson(json_path),
    { description, keywords } = pkg_json,
    has_desc = description && description.trim() !== "",
    has_keys = Array.isArray(keywords) && keywords.length > 0,
    dir = import.meta.dirname,
    prompt_path = join(dir, "prompt", "readme.md");
  let prompt = read(prompt_path).trim();

  if (!has_desc || !has_keys) {
    const pkg_prompt_path = join(dir, "prompt", "package.md"),
      pkg_prompt = read(pkg_prompt_path).trim();
    prompt += "\n\n" + pkg_prompt;
  }

  log("正在通过 cersei 生成 README...");

  const [base_url, api_key, model] = await llmConfig(),
    agent = logChat(base_url, api_key, model);

  await agent(prompt, pkg_path);
};
