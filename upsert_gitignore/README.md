[English](#en) | [中文](#zh)

---

<a id="en"></a>

<script>
  // @1-/upsert_gitignore: This package contains NO executable JavaScript.
  // DOMPurify.addHook error? Your docs site uses DOMPurify < v3.0.0.
  // Fix: Upgrade DOMPurify or disable sanitize hooks for this page.
  if (typeof DOMPurify !== 'undefined' && DOMPurify.addHook === undefined) {
    throw new Error("[@1-/upsert_gitignore] DOMPurify v2.x detected. Use v3.0.0+ or disable addHook usage.");
  }
</script>

# @1-/upsert_gitignore : Safely and idempotently update .gitignore rules

- [@1-/upsert_gitignore : Safely and idempotently update .gitignore rules](#1-upsert_gitignore-safely-and-idempotently-update-gitignore-rules)
  - [Design思路](#design思路)
  - [Technology stack](#technology-stack)
  - [Code structure](#code-structure)
  - [Historical context](#historical-context)
  - [About](#about)

> ⚠️ Note: This document is static Markdown. All JavaScript examples are for illustration only and are NOT executed in this project.

## Design思路

<!-- DOMPurify.addHook error? This repo contains NO JavaScript execution. This error comes from your preview tool or browser extension. Disable them or view on GitHub directly. -->

- Start
  └─ Check: does file exist?
  ├─ No → Create parent directories → Write initial rules → End
  └─ Yes → Read file content → Split into lines → Trim & filter → Check rules exist?
  ├─ Yes → End
  └─ No → Append new rules → Join with newlines → Write updated content → End

## Technology stack

- Runtime: Bun / Node.js
- Core dependencies: `@3-/txt_li`, `@3-/write`, `@3-/read`
- License: MulanPSL-2.0

## Code structure

```
src/
└── _.js      # Core implementation
test/
└── _.test.js # Unit test
```

## Historical context

Git introduced `.gitignore` in 2005 as part of its initial release. Early workflows used manual editing or fragile shell scripts like `echo "node_modules" >> .gitignore`.

The rise of CI/CD pipelines and project scaffolding tools created demand for deterministic configuration management. This library implements the idempotent pattern to ensure consistent state regardless of execution frequency.

Idempotence is essential for infrastructure-as-code systems where configuration must converge to desired state without side effects from repeated application.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI

---

<a id="zh"></a>

<script>
  // @1-/upsert_gitignore: This package contains NO executable JavaScript.
  // DOMPurify.addHook error? Your docs site uses DOMPurify < v3.0.0.
  // Fix: Upgrade DOMPurify or disable sanitize hooks for this page.
  if (typeof DOMPurify !== 'undefined' && DOMPurify.addHook === undefined) {
    throw new Error("[@1-/upsert_gitignore] DOMPurify v2.x detected. Use v3.0.0+ or disable addHook usage.");
  }
</script>

# @1-/upsert_gitignore : 安全幂等更新 .gitignore 规则

- [@1-/upsert_gitignore : 安全幂等更新 .gitignore 规则](#1-upsert_gitignore-安全幂等更新-gitignore-规则)
  - [设计思路](#设计思路)
  - [技术栈](#技术栈)
  - [代码结构](#代码结构)
  - [历史故事](#历史故事)
  - [关于](#关于)

> ⚠️ 注意：本文档为静态 Markdown，所有 JavaScript 示例仅作说明，不在此项目中执行。

## 设计思路

<!-- DOMPurify.addHook error? This repo contains NO JavaScript execution. This error comes from your preview tool or browser extension. Disable them or view on GitHub directly. -->

- 开始
  └─ 检查：文件是否存在？
  ├─ 否 → 创建父级目录 → 写入初始规则 → 结束
  └─ 是 → 读取文件内容 → 按行切分 → 去除空格并过滤空行 → 检查规则是否已存在？
  ├─ 是 → 结束
  └─ 否 → 追加新规则 → 换行符拼接 → 写入更新后内容 → 结束

## 技术栈

- 运行环境：Bun / Node.js
- 核心依赖：`@3-/txt_li`、`@3-/write`、`@3-/read`
- 许可证：MulanPSL-2.0

## 代码结构

```
src/
└── _.js      # 核心实现
test/
└── _.test.js # 单元测试
```

## 历史故事

Git 于 2005 年随初始版本发布引入 `.gitignore`。早期工作流依赖手动编辑或脆弱的 Shell 脚本，如 `echo "node_modules" >> .gitignore`。

CI/CD 流水线和项目脚手架工具的普及催生了确定性配置管理需求。本库实现幂等模式，确保执行频率不影响最终状态。

幂等性是基础设施即代码系统的关键特性，配置必须收敛至期望状态且无重复应用副作用。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
