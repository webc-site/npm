#!/usr/bin/env bun
import logSession from "../src/logSession.js";
import openai_conf from "../../conf/OPENAI.js";
import path from "node:path";
import fs from "node:fs";

const [base_url, api_key, model] = openai_conf,
  gen_dir = path.join(import.meta.dirname, "../test/gen");

if (!fs.existsSync(gen_dir)) {
  fs.mkdirSync(gen_dir, { recursive: true });
}

const sess = logSession(base_url, api_key, model, gen_dir),
  prompt = "1+1=多少？请只输出最简短的答案数字，不要有其他描述。",
  response = await sess(prompt),
  answer = response.trim();
console.log(answer);

if (answer.includes("2")) {
  process.exit(0);
} else {
  console.error("测试未通过，预期包含 2，但得到:", answer);
  process.exit(1);
}
