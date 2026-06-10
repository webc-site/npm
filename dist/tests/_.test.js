import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mock, test, expect } from "bun:test";
import read from "@1-/read";
import renderMdt from "@1-/mdt";
import prep from "../src/prep.js";
import findgit from "@1-/findgit";
import readme from "../src/readme.js";

mock.module("@1-/github_cdn", () => {
  return {
    default: () => async (buf, ext) => "//mock-cdn-url.com/uploaded." + ext,
  };
});

const rmDir = async (dir) => rm(dir, { recursive: true, force: true }),
  cleanDir = async (dir) => {
    if (existsSync(dir)) {
      await rmDir(dir);
    }
    await mkdir(dir, { recursive: true });
  },
  writeLines = (path, lines) => writeFile(path, lines.join("\n")),
  writeJson = (path, obj) => writeFile(path, JSON.stringify(obj));

test(
  "自定义 mdt 渲染测试",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_test_mdt");
    await cleanDir(pkg_path);

    // Create sub.md
    await writeLines(join(pkg_path, "sub.md"), [
      "## Sub 1",
      "Some description for sub 1.",
      "### Sub Sub 1",
      "Some content.",
      "```",
      "# This is a comment inside code block, should not be a header",
      "```",
      "## Sub 2",
      "Some content.",
    ]);

    // Create README.mdt
    await writeLines(join(pkg_path, "README.mdt"), [
      "[English](#en) | [中文](#zh)",
      "",
      "---",
      "",
      '<a id="en"></a>',
      "# Test Project",
      "<+ ./sub.md >",
      "",
      "---",
      "",
      '<a id="zh"></a>',
      "# 测试项目",
      "## 1. 简介",
      "这里是简介。",
    ]);

    // Render MDT
    const res = await renderMdt(join(pkg_path, "README.mdt"), pkg_path),
      // Split blocks to check TOC
      blocks = res.split("\n---\n");
    expect(blocks.length).toBe(3);

    // Block 0 should have no TOC (no headers)
    expect(blocks[0]).not.toContain("- [");

    // Block 1 should contain English TOC
    expect(blocks[1]).toContain("# Test Project");
    expect(blocks[1]).toContain("- [Test Project](#test-project)");
    expect(blocks[1]).toContain("  - [Sub 1](#sub-1)");
    expect(blocks[1]).toContain("    - [Sub Sub 1](#sub-sub-1)");
    expect(blocks[1]).toContain("  - [Sub 2](#sub-2)");
    // Should NOT contain the code block comment as TOC item
    expect(blocks[1]).not.toContain("comment-inside-code-block");

    // Block 2 should contain Chinese TOC
    expect(blocks[2]).toContain("# 测试项目");
    expect(blocks[2]).toContain("- [测试项目](#测试项目)");
    expect(blocks[2]).toContain("  - [1. 简介](#1-简介)");

    // Clean up
    await rmDir(pkg_path);
  },
  { timeout: 30000 },
);

test(
  "生成 readme 并上传 svg",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_test_readme"),
      tmp_dir = join(import.meta.dirname, "tmp_test_readme_tmp"),
      dirs = [pkg_path, tmp_dir];

    await Promise.all(dirs.map(cleanDir));

    // Create README.mdt with mermaid
    await writeLines(join(pkg_path, "README.mdt"), [
      "# Project with Mermaid",
      "```mermaid",
      "graph TD",
      "    A --> B",
      "```",
    ]);

    // Call readme
    await readme(findgit(pkg_path), pkg_path, tmp_dir);

    // Verify files created
    const dest_readme_path = join(pkg_path, "README.md"),
      tmp_readme_path = join(tmp_dir, "README.md");

    expect(existsSync(dest_readme_path)).toBe(true);
    expect(existsSync(tmp_readme_path)).toBe(true);

    const dest_content = await read(dest_readme_path),
      tmp_content = await read(tmp_readme_path);

    // The original readme.md should retain the mermaid code block
    expect(dest_content).toContain("```mermaid");

    // The temp readme.md should have the svg URL instead of code block
    expect(tmp_content).not.toContain("```mermaid");
    expect(tmp_content).toContain("https://mock-cdn-url.com/uploaded.svg");

    // Clean up
    await Promise.all(dirs.map(rmDir));
  },
  { timeout: 30000 },
);

test(
  "指定自定义源码目录执行 prep 测试",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_pkg_custom"),
      pkg_json_path = join(pkg_path, "package.json");

    await cleanDir(pkg_path);

    // Write mock package.json
    await writeJson(pkg_json_path, { name: "test-custom-pkg", version: "1.0.0" });

    // Create custom src dir
    const lib_path = join(pkg_path, "lib");
    await mkdir(lib_path, { recursive: true });
    await writeFile(join(lib_path, "index.js"), "console.log('hello')");

    // Call prep with "lib" as src_dir
    const [pkg_name, tmp_dir, , , current_version, next_version] = await prep(
      pkg_path,
      "tmp_pkg_custom",
      "lib",
    );

    expect(pkg_name).toBe("test-custom-pkg");
    expect(current_version).toBe("1.0.0");
    expect(next_version).toBe("1.0.1");

    // Check index.js copied
    const copied_index_path = join(tmp_dir, "index.js");
    expect(existsSync(copied_index_path)).toBe(true);
    expect(await read(copied_index_path)).toBe("console.log('hello')");

    // Check package.json copied
    const copied_pkg_json_path = join(tmp_dir, "package.json");
    expect(existsSync(copied_pkg_json_path)).toBe(true);

    // Clean up
    await Promise.all([pkg_path, tmp_dir].map(rmDir));
  },
  { timeout: 30000 },
);

test(
  "生成 readme 且指定自定义源码目录 (如 lib) 时，将带有 svg 的 readme 写入 lib 目录",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_test_readme_lib"),
      tmp_dir = join(import.meta.dirname, "tmp_test_readme_lib_tmp"),
      lib_path = join(pkg_path, "lib"),
      dirs = [pkg_path, tmp_dir];

    await Promise.all(dirs.map(cleanDir));
    await mkdir(lib_path, { recursive: true });

    // Create README.mdt with mermaid
    await writeLines(join(pkg_path, "README.mdt"), [
      "# Project with Mermaid",
      "```mermaid",
      "graph TD",
      "    A --> B",
      "```",
    ]);

    // Pre-create lib/README.md
    await writeFile(join(lib_path, "README.md"), "old content");

    // Call readme
    await readme(findgit(pkg_path), pkg_path, tmp_dir, "lib");

    // Verify files created
    const dest_readme_path = join(pkg_path, "README.md"),
      tmp_readme_path = join(tmp_dir, "README.md"),
      lib_readme_path = join(lib_path, "README.md");

    expect(existsSync(dest_readme_path)).toBe(true);
    expect(existsSync(tmp_readme_path)).toBe(true);
    expect(existsSync(lib_readme_path)).toBe(true);

    const dest_content = await read(dest_readme_path),
      tmp_content = await read(tmp_readme_path),
      lib_content = await read(lib_readme_path);

    // Root README.md should retain the mermaid code block
    expect(dest_content).toContain("```mermaid");

    // Temp README.md should have SVG
    expect(tmp_content).not.toContain("```mermaid");
    expect(tmp_content).toContain("https://mock-cdn-url.com/uploaded.svg");

    // Lib README.md should have SVG
    expect(lib_content).not.toContain("```mermaid");
    expect(lib_content).toContain("https://mock-cdn-url.com/uploaded.svg");

    // Clean up
    await Promise.all(dirs.map(rmDir));
  },
  { timeout: 30000 },
);
