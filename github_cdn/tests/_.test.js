#!/usr/bin/env -S bun test

import utf8e from "@3-/utf8/utf8e.js";
import { test, expect } from "bun:test";
import token from "../../conf/github.js";
import repo from "../../conf/github/FS.js";
import md5B64 from "@3-/base64url/md5B64.js";
import cdnUpload from "../src/_.js";

test("上传至 GitHub 获取 CDN", async () => {
  const upload = cdnUpload(token, repo),
    rand_str = "test-" + Math.random(),
    rand_data = utf8e(rand_str),
    hash_str = md5B64(rand_data),
    branch = hash_str.slice(0, 2),
    path = hash_str.slice(2) + ".txt",
    headers = {
      Authorization: "token " + token,
      "User-Agent": "github-cdn",
    },
    api = (url, opt) =>
      fetch("https://api.github.com/repos/" + repo + "/" + url, {
        ...opt,
        headers: opt?.headers ? { ...headers, ...opt.headers } : headers,
      });

  let before_sha,
    is_new_branch = false;

  try {
    const res = await api("git/refs/heads/" + branch);
    if (res.status === 200) {
      const data = await res.json();
      before_sha = data.object.sha;
    } else {
      is_new_branch = true;
    }
  } catch {
    is_new_branch = true;
  }

  const cdn_url = await upload(rand_data, "txt");

  expect(cdn_url).toContain("//fastly.jsdelivr.net/gh/" + repo + "@");
  expect(cdn_url.endsWith(".txt")).toBe(true);

  const res = await api("contents/" + path + "?ref=" + branch),
    data = await res.json();

  expect(res.status).toBe(200);
  expect(Buffer.from(data.content, "base64").toString()).toBe(rand_str);

  if (is_new_branch) {
    const del_res = await api("git/refs/heads/" + branch, {
      method: "DELETE",
    });
    expect(del_res.status).toBe(204);
  } else if (before_sha) {
    const reset_res = await api("git/refs/heads/" + branch, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sha: before_sha,
        force: true,
      }),
    });
    expect(reset_res.status).toBe(200);
  }
}, 20000);
