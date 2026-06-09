import { existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { readFile, writeFile, chmod } from "node:fs/promises";
import ERR from "@3-/log/ERR.js";

const find = (dir) => {
    if (existsSync(join(dir, ".git"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    return find(parent);
  },
  install = async () => {
    const git_root = find(import.meta.dirname);
    if (!git_root) {
      ERR("Git root not found.");
      process.exit(1);
    }

    const cli_rel = relative(git_root, join(import.meta.dirname, "cli.js")),
      is_husky = existsSync(join(git_root, ".husky")),
      hook_dir = is_husky ? join(git_root, ".husky") : join(git_root, ".git/hooks"),
      pre_commit_path = join(hook_dir, "pre-commit"),
      post_merge_path = join(hook_dir, "post-merge"),
      write = async (file_path, command) => {
        let content = "#!/bin/sh\n";
        if (existsSync(file_path)) {
          const existing = await readFile(file_path, "utf8");
          if (existing.includes(command)) {
            return;
          }
          content = existing.endsWith("\n") ? existing : existing + "\n";
        }
        await writeFile(file_path, content + command + "\n");
        await chmod(file_path, 0o755);
      };

    await write(pre_commit_path, "bun run " + cli_rel + " dump");
    await write(post_merge_path, "bun run " + cli_rel + " load");

    process.stdout.write("Git hooks installed successfully at " + hook_dir + "\n");
  };

install();
