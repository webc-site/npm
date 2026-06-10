#!/usr/bin/env bun
import { expect } from "bun:test";
import { session, MSG_TXT } from "../src/_.js";
import { base_url, api_key, model, gen_dir, test } from "./setup.js";

test("自动记忆累加的多轮对话测试", async () => {
  const sess = session(base_url, api_key, model, gen_dir);

  // 第一轮对话
  for await (const _ of sess("请记住，我最喜欢的颜色是粉色。仅执行此指令，不干其他。")) {
  }

  // 第二轮对话
  let response = "";
  for await (const [type, content] of sess(
    "我刚才说我最喜欢的颜色是什么？仅执行此指令，不干其他。",
  )) {
    if (type === MSG_TXT) {
      response += content;
    }
  }

  expect(response.includes("粉色")).toBe(true);
  console.log("多轮对话回答：" + response);
}, 90000);
