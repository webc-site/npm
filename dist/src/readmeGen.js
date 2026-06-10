// import { join, basename } from "node:path";
// import log from "@3-/log";
// import read from "@3-/read";
// import rJson from "@3-/read/rJson.js";
// import opencode from "../../opencode/src/_.js";

export default async (_pkg_path) => {
  // const pkg_json_path = join(pkg_path, "package.json"),
  //   pkg_json = rJson(pkg_json_path),
  //   { description, keywords } = pkg_json,
  //   has_description = description && description.trim() !== "",
  //   has_keywords = Array.isArray(keywords) && keywords.length > 0,
  //   readme_prompt_path = join(import.meta.dirname, "prompt", "readme.md");
  // let prompt_text = read(readme_prompt_path).trim();
  //
  // if (!has_description || !has_keywords) {
  //   const package_prompt_path = join(import.meta.dirname, "prompt", "package.md"),
  //     package_prompt = read(package_prompt_path).trim();
  //   prompt_text += "\n\n" + package_prompt;
  // }
  //
  // log("正在通过 opencode 生成 README...");
  //
  // const helper = await opencode(pkg_path, basename(pkg_path) + " README.md"),
  //   [runPrompt] = helper;
  // await runPrompt(prompt_text);
};
