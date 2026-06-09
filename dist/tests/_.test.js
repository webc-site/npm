#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import readme from "../src/readme.js";

test("dist readme processing test", async () => {
  const pkg_path = path.join(import.meta.dirname, "tmp_pkg"),
    tmp_dir = path.join(import.meta.dirname, "tmp_publish");

  // Clean up
  for (const dir of [pkg_path, tmp_dir]) {
    if (existsSync(dir)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    await fs.mkdir(dir, { recursive: true });
  }

  // Create README.mdt
  const mdt_content = ["# Test Package", "", "```mermaid", "graph LR", "  A --> B", "```"].join(
    "\n",
  );

  await fs.writeFile(path.join(pkg_path, "README.mdt"), mdt_content);

  // Run readme generator
  await readme(pkg_path, tmp_dir);

  // 1. Verify local README.md exists and contains original mermaid
  const local_readme_path = path.join(pkg_path, "README.md");
  expect(existsSync(local_readme_path)).toBe(true);
  const local_readme = await fs.readFile(local_readme_path, "utf8");
  expect(local_readme).toContain("```mermaid");
  expect(local_readme).not.toContain("<svg");

  // 2. Verify publish README.md exists and has mermaid replaced with SVG
  const publish_readme_path = path.join(tmp_dir, "README.md");
  expect(existsSync(publish_readme_path)).toBe(true);
  const publish_readme = await fs.readFile(publish_readme_path, "utf8");
  expect(publish_readme).not.toContain("```mermaid");
  expect(publish_readme).toContain("<svg");

  // Clean up
  await fs.rm(pkg_path, { recursive: true, force: true });
  await fs.rm(tmp_dir, { recursive: true, force: true });
});
