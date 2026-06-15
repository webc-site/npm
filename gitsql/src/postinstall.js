#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { writeFile } from "node:fs/promises";
import read from "./read.js";

const CACHE = ".cache",
  find = (dir) => {
    if (existsSync(join(dir, ".git"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    return find(parent);
  },
  append = async (file_path, content, default_head = "") => {
    const existing = existsSync(file_path) ? await read(file_path) : default_head;

    if (!existing || existing.includes(content)) {
      return;
    }
    await writeFile(file_path, existing + (existing.endsWith("\n") ? "" : "\n") + content + "\n");
  },
  install = async () => {
    const git_root = find(import.meta.dirname);
    if (!git_root) {
      return;
    }
    await append(join(git_root, ".gitignore"), CACHE);
  };

install();
