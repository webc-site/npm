#!/usr/bin/env bun
import { expect } from "bun:test";
import read from "@3-/read";
import fs from "node:fs";
import path from "node:path";
import chat, { MSG_TXT } from "../src/_.js";
import { base_url, api_key, model, gen_dir, test } from "./setup.js";
import MSG from "./MSG.js";

const tmp_file = path.join(gen_dir, "tmp.md");

test("流式代理交互与工具调用测试", async () => {
  if (fs.existsSync(tmp_file)) {
    fs.unlinkSync(tmp_file);
  }
  if (!fs.existsSync(gen_dir)) {
    fs.mkdirSync(gen_dir, { recursive: true });
  }

  const agent = chat(base_url, api_key, model),
    prompt = "在 tmp.md 里写一个关于程序员的笑话。仅执行此指令，不干其他。";

  for await (const [type, content] of agent(prompt, gen_dir)) {
    if (type === MSG_TXT) {
      process.stdout.write(content);
    } else {
      const name = MSG[type] || type;
      console.log("\n[事件类型: " + name + "] 内容: " + content);
    }
  }

  expect(fs.existsSync(tmp_file)).toBe(true);
  const joke = read(tmp_file).trim();
  expect(joke.length).toBeGreaterThan(0);
  console.log("笑话内容：\n" + joke);
}, 120000);
