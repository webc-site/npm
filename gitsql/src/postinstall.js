#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { writeFile, chmod } from "node:fs/promises";
import read from "./read.js";

const HUSKY = ".husky",
  RUN = "bun run ",
  CACHE = ".cache",
  SH = "#!/bin/sh",
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

    const cli_rel = relative(git_root, join(import.meta.dirname, "cli.js")),
      is_husky = existsSync(join(git_root, HUSKY)),
      hook_dir = is_husky ? join(git_root, HUSKY) : join(git_root, ".git/hooks"),
      pre_commit_path = join(hook_dir, "pre-commit"),
      post_merge_path = join(hook_dir, "post-merge"),
      write = async (file_path, command) => {
        await append(file_path, command, SH);
        await chmod(file_path, 0o755);
      };

    await write(pre_commit_path, RUN + cli_rel + " dump");
    await write(post_merge_path, RUN + cli_rel + " load");

    await append(join(git_root, ".gitignore"), CACHE);

    process.stdout.write("Git hooks installed successfully at " + hook_dir + "\n");
  };

install();
