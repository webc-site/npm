import { env } from "node:process";
import { test as bun_test } from "bun:test";
import path from "node:path";
import openai_conf from "../../conf/OPENAI.js";

const [base_url, api_key, model] = openai_conf,
  __dirname = import.meta.dirname,
  gen_dir = path.join(__dirname, "gen"),
  is_test_runner = env.NODE_ENV === "test",
  test = is_test_runner
    ? bun_test
    : async (name, fn) => {
        console.log("运行测试: " + name);
        await fn();
      },
  user = (content) => ({ role: "user", content }),
  assistant = (content) => ({ role: "assistant", content });

export { base_url, api_key, model, gen_dir, test, user, assistant };
