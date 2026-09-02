#!/usr/bin/env -S bun test

import utf8e from "@3-/utf8/utf8e.js";
import md5B64 from "@3-/base64url/md5B64.js";
import { test, expect } from "bun:test";
import token from "../../conf/github.js";
import repo from "../../conf/github/FS.js";
import CDN from "../src/CDN.js";
import cdnUpload from "../src/_.js";
import reqInit from "../src/req.js";

const req = reqInit(token, repo),
  upload = cdnUpload(token, repo),
  read = async (path, branch) => {
    const res = await req("contents/" + path + "?ref=" + branch),
      { content } = await res.json();
    return Buffer.from(content, "base64").toString();
  },
  branchSha = async (branch) => {
    try {
      const res = await req("git/refs/heads/" + branch),
        {
          object: { sha }
        } = await res.json();
      return sha;
    } catch {}
  },
  branchClean = async (branch, sha) => {
    try {
      if (sha) {
        await req("git/refs/heads/" + branch, {
          method: "PATCH",
          body: { sha, force: true }
        });
      } else {
        await req("git/refs/heads/" + branch, { method: "DELETE" });
      }
    } catch {}
  };

test("CDN 候选列表", () => {
  const urls = [...CDN("a/b", "main", "1.txt")];
  expect(urls.length).toBeGreaterThan(0);
  urls.forEach((url) => {
    expect(url.startsWith("//")).toBe(true);
    expect(url.endsWith("/gh/a/b@main/1.txt")).toBe(true);
  });
});

test("上传与读取", async () => {
  const rand_str = "test-" + Math.random(),
    rand_data = utf8e(rand_str),
    hash_str = md5B64(rand_data),
    branch = hash_str.slice(0, 2),
    path = hash_str.slice(2) + ".txt",
    before_sha = await branchSha(branch),
    valid_urls = new Set(CDN(repo, branch, path));

  try {
    const cdn_url = await upload(rand_data, "txt");
    expect(valid_urls.has(cdn_url)).toBe(true);
    expect(cdn_url.endsWith(".txt")).toBe(true);

    const txt = await read(path, branch);
    expect(txt).toBe(rand_str);

    const cached_url = await upload(rand_data, "txt");
    expect(cached_url).toBe(cdn_url);
  } finally {
    await branchClean(branch, before_sha);
  }
}, 30000);
