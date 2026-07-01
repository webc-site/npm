import { existsSync } from "node:fs";
import { rm as fs_rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mock, test, expect } from "bun:test";
import read from "@1-/read";
import renderMdt from "@1-/mdt";
import prep from "../src/prep.js";
import findgit from "@1-/findgit";
import readme from "../src/readme.js";

const MOCK_HOME = join(import.meta.dirname, "mock_home"),
  TIMEOUT = 30000,
  rm = async (dir) => fs_rm(dir, { recursive: true, force: true }),
  clean = async (dir) => {
    await rm(dir);
    await mkdir(dir, { recursive: true });
  },
  write = (path, val) =>
    writeFile(
      path,
      Array.isArray(val) ? val.join("\n") : typeof val === "object" ? JSON.stringify(val) : val,
    ),
  draw = (dir) =>
    write(join(dir, "README.mdt"), [
      "# Project with Mermaid",
      "```mermaid",
      "graph TD",
      "    A --> B",
      "```",
    ]),
  exist = (paths) => paths.forEach((p) => expect(existsSync(p)).toBe(true)),
  match = async (paths, has_mermaid, has_svg) => {
    exist(paths);
    const contents = await Promise.all(paths.map(read));
    contents.forEach((content, i) => {
      if (has_mermaid[i]) {
        expect(content).toContain("```mermaid");
      } else {
        expect(content).not.toContain("```mermaid");
      }
      if (has_svg[i]) {
        expect(content).toContain("https://mock-cdn-url.com/uploaded.svg");
      } else {
        expect(content).not.toContain("https://mock-cdn-url.com/uploaded.svg");
      }
    });
  };

mock.module("node:os", () => {
  return {
    homedir: () => MOCK_HOME,
  };
});

mock.module("cersei_rs/logSession", () => {
  return {
    default: (base_url, api_key, model, pkg_path) => {
      let turns = 0;
      return async () => {
        turns++;
        const readme_dir = join(pkg_path, "readme"),
          zh_dir = join(readme_dir, "zh"),
          en_dir = join(readme_dir, "en"),
          zh_file = join(zh_dir, "README.md"),
          en_file = join(en_dir, "README.md");

        await Promise.all([zh_dir, en_dir].map((d) => mkdir(d, { recursive: true })));

        if (turns === 1) {
          await writeFile(zh_file, "# 中文文档\n```mermaid\ngraph TD\n    A -> B\n```");
          await writeFile(en_file, "# English Doc\n```mermaid\ngraph TD\n    A --> B\n```");
        } else {
          await writeFile(zh_file, "# 中文文档\n```mermaid\ngraph TD\n    A --> B\n```");
        }
      };
    },
  };
});

import readmeGen from "../src/readmeGen.js";

mock.module("@1-/github_cdn", () => {
  return {
    default: () => async (buf, ext) => "//mock-cdn-url.com/uploaded." + ext,
  };
});

test(
  "自定义 mdt 渲染测试",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_test_mdt");
    await clean(pkg_path);

    // Create sub.md
    await write(join(pkg_path, "sub.md"), [
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
    await write(join(pkg_path, "README.mdt"), [
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
    [
      "# Test Project",
      "- [Test Project](#test-project)",
      "  - [Sub 1](#sub-1)",
      "    - [Sub Sub 1](#sub-sub-1)",
      "  - [Sub 2](#sub-2)",
    ].forEach((t) => expect(blocks[1]).toContain(t));
    expect(blocks[1]).not.toContain("comment-inside-code-block");

    // Block 2 should contain Chinese TOC
    ["# 测试项目", "- [测试项目](#测试项目)", "  - [1. 简介](#1-简介)"].forEach((t) =>
      expect(blocks[2]).toContain(t),
    );

    // Clean up
    await rm(pkg_path);
  },
  { timeout: TIMEOUT },
);

test(
  "生成 readme 并上传 svg",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_test_readme"),
      tmp_dir = join(import.meta.dirname, "tmp_test_readme_tmp"),
      dirs = [pkg_path, tmp_dir];

    await Promise.all(dirs.map(clean));

    // Create README.mdt with mermaid
    await draw(pkg_path);

    // Call readme
    await readme(findgit(pkg_path), pkg_path, tmp_dir);

    // Verify files created
    await match(
      [join(pkg_path, "README.md"), join(tmp_dir, "README.md")],
      [true, false],
      [false, true],
    );

    // Clean up
    await Promise.all(dirs.map(rm));
  },
  { timeout: TIMEOUT },
);

test(
  "指定自定义源码目录执行 prep 测试",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_pkg_custom"),
      pkg_json_path = join(pkg_path, "package.json"),
      lib_path = join(pkg_path, "lib");

    await clean(pkg_path);

    // Write mock package.json
    await write(pkg_json_path, { name: "test-custom-pkg", version: "1.0.0" });

    // Create custom src dir
    await mkdir(lib_path, { recursive: true });
    await write(join(lib_path, "index.js"), "console.log('hello')");

    // Call prep with "lib" as src_dir
    const [pkg_name, tmp_dir, , , current_version, next_version] = await prep(
        pkg_path,
        "tmp_pkg_custom",
        "lib",
      ),
      index_path = join(tmp_dir, "index.js"),
      json_path = join(tmp_dir, "package.json");

    expect(pkg_name).toBe("test-custom-pkg");
    expect(current_version).toBe("1.0.0");
    expect(next_version).toBe("1.0.1");

    // Check files copied
    exist([index_path, json_path]);
    expect(await read(index_path)).toBe("console.log('hello')");

    // Clean up
    await Promise.all([pkg_path, tmp_dir].map(rm));
  },
  { timeout: TIMEOUT },
);

test(
  "指定自定义源码目录生成 readme",
  async () => {
    const pkg_path = join(import.meta.dirname, "tmp_test_readme_lib"),
      tmp_dir = join(import.meta.dirname, "tmp_test_readme_lib_tmp"),
      lib_path = join(pkg_path, "lib"),
      dirs = [pkg_path, tmp_dir];

    await Promise.all(dirs.map(clean));
    await mkdir(lib_path, { recursive: true });

    // Create README.mdt with mermaid
    await draw(pkg_path);

    // Pre-create lib/README.md
    await write(join(lib_path, "README.md"), "old content");

    // Call readme
    await readme(findgit(pkg_path), pkg_path, tmp_dir, "lib");

    // Verify files created
    await match(
      [join(pkg_path, "README.md"), join(tmp_dir, "README.md"), join(lib_path, "README.md")],
      [true, false, false],
      [false, true, true],
    );

    // Clean up
    await Promise.all(dirs.map(rm));
  },
  { timeout: TIMEOUT },
);

test(
  "readmeGen 正常生成与校验修复流程",
  async () => {
    const config_dir = join(MOCK_HOME, ".config"),
      config_path = join(config_dir, "OPENAI.js"),
      pkg_path = join(import.meta.dirname, "tmp_test_readme_gen"),
      zh_file = join(pkg_path, "readme", "zh", "README.md"),
      en_file = join(pkg_path, "readme", "en", "README.md");

    await clean(MOCK_HOME);
    await mkdir(config_dir, { recursive: true });
    await write(
      config_path,
      "export default [ 'https://api.openai.com/v1', 'mock-key', 'gpt-4o' ]",
    );

    await clean(pkg_path);
    await write(join(pkg_path, "package.json"), {
      name: "test-gen",
      description: "a test package",
      keywords: ["test"],
    });

    await readmeGen(pkg_path);

    expect(existsSync(zh_file)).toBe(true);
    expect(existsSync(en_file)).toBe(true);

    const zh_content = await read(zh_file);
    expect(zh_content).toContain("A --> B");

    await Promise.all([pkg_path, MOCK_HOME].map(rm));
  },
  { timeout: TIMEOUT },
);
