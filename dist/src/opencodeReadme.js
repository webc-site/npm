import path from "node:path";
import read from "@3-/read";
import rJson from "@3-/read/rJson.js";
import ROOT from "../../_/ROOT.js";
import LANG from "../../_/conf/LANG.js";
import opencode from "../../opencode/src/_.js";

export default async (pkg_path) => {
  const pkg_json_path = path.join(pkg_path, "package.json"),
    pkg_json = rJson(pkg_json_path),
    has_description = pkg_json.description && pkg_json.description.trim() !== "",
    has_keywords = Array.isArray(pkg_json.keywords) && pkg_json.keywords.length > 0,
    readme_prompt_path = path.join(ROOT, "doc", LANG, "skills/readme/readme.md");
  let prompt_text = read(readme_prompt_path).trim();

  if (!has_description || !has_keywords) {
    const package_prompt_path = path.join(ROOT, "doc", LANG, "skills/readme/package.md"),
      package_prompt = read(package_prompt_path).trim();
    prompt_text += "\n\n" + package_prompt;
  }

  console.log("正在通过 opencode 生成 README...");

  await using helper = await opencode(pkg_path, path.basename(pkg_path) + " README.md");
  const [runPrompt] = helper;
  await runPrompt(prompt_text);
};
