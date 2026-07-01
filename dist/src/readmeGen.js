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

const load = async () => {
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
    prompt_path = join(dir, "prompt", "readme.eta"),
    readme_dir = join(pkg_path, "readme"),
    zh_path = join(readme_dir, "zh", "README.md"),
    en_path = join(readme_dir, "en", "README.md"),
    zh_exists = existsSync(zh_path),
    en_exists = existsSync(en_path);

  let readme_zh = "",
    readme_en = "";

  if (zh_exists && en_exists) {
    readme_zh = read(zh_path).trim();
    readme_en = read(en_path).trim();
    log("正在通过 cersei 修订并更新 README...");
  } else {
    log("正在通过 cersei 初始化 README...");
  }

  const eta = new Eta(),
    template = read(prompt_path),
    prompt = eta.renderString(template, {
      readme_zh,
      readme_en,
      has_desc,
      has_keys,
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

    const errors = [];
    for (const file_path of md_files) {
      const err = await pathCheck(file_path);
      if (err.length > 0) {
        errors.push([relative(pkg_path, file_path), err]);
      }
    }

    if (errors.length === 0) {
      break;
    }

    let err_msg = "检测到以下 Markdown 文件路径校验错误：\n";
    errors.forEach(([file, err]) => {
      err_msg += "\n" + file + ":\n";
      err.forEach(([line, msg]) => {
        err_msg += "  line " + line + ": " + msg + "\n";
      });
    });
    err_msg += "\n请修复这些路径错误。";

    log(err_msg);
    await agent(err_msg);
  }
};
