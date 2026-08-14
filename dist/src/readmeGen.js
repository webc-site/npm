import { join, relative } from "node:path";
import { Eta } from "eta";
import log from "@3-/log";
import read from "@3-/read";
import rJson from "@3-/read/rJson.js";
import logSession from "cersei_rs/logSession";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import pathCheck from "@1-/mdcheck/pathCheck.js";

const ERR_CONFIG = "Unable to locate LLM configuration at ",
  load = async () => {
    const config_path = join(homedir(), ".config", "OPENAI.js");
    if (existsSync(config_path)) {
      const { default: config } = await import(config_path);
      if (Array.isArray(config) && config.length >= 3) {
        return config;
      }
    }
    throw new Error(
      ERR_CONFIG + config_path + ". The file must export default [ base_url, api_key, model ]."
    );
  };

export default async (pkg_path) => {
  const json_path = join(pkg_path, "package.json"),
    pkg_json = rJson(json_path),
    { description, keywords } = pkg_json,
    has_desc = !!description?.trim(),
    has_keys = Array.isArray(keywords) && !!keywords.length,
    dir = import.meta.dirname,
    prompt_path = join(dir, "prompt", "readme.eta"),
    readme_dir = join(pkg_path, "readme"),
    [zh_path, en_path] = ["zh", "en"].map((lang) => join(readme_dir, lang, "README.md")),
    [zh_exists, en_exists] = [zh_path, en_path].map(existsSync),
    is_update = zh_exists && en_exists,
    [readme_zh, readme_en] = [zh_path, en_path].map((p) => (is_update ? read(p).trim() : ""));

  log(is_update ? "正在通过 cersei 修订并更新 README..." : "正在通过 cersei 初始化 README...");

  const prompt = new Eta().renderString(read(prompt_path), {
      readme_zh,
      readme_en,
      has_desc,
      has_keys
    }),
    [base_url, api_key, model] = await load(),
    agent = logSession(base_url, api_key, model, pkg_path);

  await agent(prompt);

  for (;;) {
    const md_files = [];
    if (existsSync(readme_dir)) {
      await walkRelIgnore(readme_dir, (kind, rel_path) => {
        if (kind === 2 && rel_path.endsWith(".md")) {
          md_files.push(join(readme_dir, rel_path));
        }
      });
    }

    const errors = (
      await Promise.all(
        md_files.map(async (file_path) => [
          relative(pkg_path, file_path),
          await pathCheck(file_path)
        ])
      )
    ).filter(([_, err]) => err.length);

    if (errors.length === 0) {
      break;
    }

    const err_msg =
      "检测到以下 Markdown 文件 Mermaid 语法校验错误：\n" +
      errors
        .map(
          ([file, err]) =>
            "\n" + file + ":\n" + err.map(([line, msg]) => "  line " + line + ": " + msg).join("\n")
        )
        .join("\n") +
      "\n\n请修复这些 Mermaid 语法错误。";

    log(err_msg);
    await agent(err_msg);
  }

  if (!has_desc) {
    const desc_prompt =
      "package.json is missing a description. Please directly update package.json to add a concise, one-sentence English description for this project.";
    log("正在通过 AI 写入 package.json 英文描述...");
    await agent(desc_prompt);

    if (!rJson(json_path).description?.trim()) {
      throw new Error("AI 未能成功在 package.json 中写入描述");
    }
  }
};
