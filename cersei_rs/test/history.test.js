#!/usr/bin/env bun
import { expect } from "bun:test";
import logSession from "../src/logSession.js";
import { base_url, api_key, model, gen_dir, test, user, assistant } from "./setup.js";

test("加载历史对话测试", async () => {
  const history = [
      user("请记住我的名字是：Cersei"),
      assistant("好的，我记住了，您的名字是 Cersei。"),
    ],
    sess = logSession(base_url, api_key, model, gen_dir, history),
    prompt = "我的名字是什么？请用简短的一句话回答。仅执行此指令，不干其他。",
    response = await sess(prompt);

  expect(response.includes("Cersei")).toBe(true);
  console.log("回答内容：" + response);
}, 90000);
