#!/usr/bin/env bun

import read from "@3-/read";
import { writeFileSync } from "fs";
import { join } from "path";
import ROOT from "./ROOT.js";

const main = async () => {
  const path = join(ROOT, "Cargo.toml");
  let content;
  try {
    content = read(path);
  } catch (err) {
    process.stderr.write("读取 Cargo.toml 失败: " + err.message + "\n");
    process.exit(1);
  }

  const name_match = content.match(/name\s*=\s*"([^"]+)"/);
  if (!name_match) {
    process.stderr.write("未在 Cargo.toml 中找到包名\n");
    process.exit(1);
  }
  const name = name_match[1];

  let max_version;
  try {
    const res = await fetch("https://crates.io/api/v1/crates/" + name, {
      headers: {
        "User-Agent": "versionBump-bot (github.com/webc-site/npm)",
      },
    });
    if (res.status === 404) {
      max_version = "0.0.0";
    } else if (!res.ok) {
      throw new Error("crates.io API 返回错误: " + res.status + " " + res.statusText);
    } else {
      const data = await res.json();
      max_version = data.crate?.max_version;
      if (!max_version) {
        throw new Error("接口返回数据中缺少 max_version");
      }
    }
  } catch (err) {
    process.stderr.write("获取 crates.io 版本失败: " + err.message + "\n");
    process.exit(1);
  }

  const match = max_version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    process.stderr.write("解析最新版本号失败: " + max_version + "\n");
    process.exit(1);
  }

  const [_, major, minor, patch] = match,
    new_ver = major + "." + minor + "." + (parseInt(patch) + 1),
    next_content = content.replace(/version\s*=\s*"\d+\.\d+\.\d+"/, 'version = "' + new_ver + '"');

  try {
    writeFileSync(path, next_content);
  } catch (err) {
    process.stderr.write("写入 Cargo.toml 失败: " + err.message + "\n");
    process.exit(1);
  }

  process.stdout.write(new_ver);
};

await main();
