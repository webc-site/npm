import { expect, test } from "bun:test";
import gitCmd from "../src/lib/git/cmd.js";
import remotes from "../src/lib/git/remotes.js";

test("gitCmd", () => {
  expect(typeof gitCmd).toBe("function");
});

test("remotes", async () => {
  const [remote_li, gh_remote] = await remotes(process.cwd());
  expect(Array.isArray(remote_li)).toBe(true);
  expect(typeof gh_remote).toBe("string");
});
