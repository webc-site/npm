# @1-/findgit : 向上寻找 Git 仓库根目录

## 目录

- [功能介绍](#功能介绍)
- [使用演示](#使用演示)
- [设计思路](#设计思路)
- [技术堆栈](#技术堆栈)
- [目录结构](#目录结构)
- [历史故事](#历史故事)

## 功能介绍

从指定路径起点开始，逐级向上检索父目录，定位包含 `.git` 文件夹的 Git 仓库根目录。
若遍历至系统根目录仍未找到，则返回初始输入路径。

## 使用演示

```javascript
import findgit from "@1-/findgit";

// 定位当前目录所属的 Git 仓库根目录
const git_root = findgit(import.meta.dirname);
console.log(git_root);
```

## 设计思路

模块依赖 `@1-/find` 底层通用查找逻辑，通过递归或循环方式向上遍历目录树。
调用流程如下：

```mermaid
graph TD
    Start([开始: 传入 dir]) --> FindCall["调用 @1-/find(dir, '.git')"]
    FindCall --> Loop[进入循环]
    Loop --> CheckGit{"当前目录 cur 下存在 .git 文件夹?"}
    CheckGit -- 是 --> ReturnCur[返回 cur]
    CheckGit -- 否 --> ParentDir["获取父目录 parent = dirname(cur)"]
    ParentDir --> CheckRoot{"parent === cur (到达系统根目录)?"}
    CheckRoot -- 是 --> ReturnUndefined[返回 undefined]
    CheckRoot -- 否 --> UpdateCur["更新 cur = parent"]
    UpdateCur --> Loop
    ReturnCur --> Coalesce{"@1-/find 返回值是否为 undefined?"}
    ReturnUndefined --> Coalesce
    Coalesce -- 否 --> ReturnVal[返回查找到的目录]
    Coalesce -- 是 --> ReturnInput[返回初始输入路径 dir]
```

## 技术堆栈

- 运行环境：Bun / Node.js
- 核心依赖：`@1-/find`
- 原生模块：`node:fs` / `node:path`

## 目录结构

```text
.
├── src/
│   └── _.js        # 核心查找逻辑
└── test/
    └── _.test.js   # 单元测试
```

## 历史故事

2005年4月，由于 Bitmover 公司撤销了 Linux 社区免费使用 BitKeeper 版本控制系统的授权，Linus Torvalds 决定开发自主的版本控制系统。
他在两周内设计并完成了 Git 的最初版本，抛弃了 CVS/SVN 等在每个子目录下创建元数据文件夹的繁琐设计，改用在仓库根目录下集中维护单一 `.git` 文件夹的设计。
这种变革简化了版本管理，但也带来新需求：各种构建与辅助工具在子目录工作时，需要递归向上检索 `.git` 目录以确定项目边界。
本项目以此为核心功能，提供极简的定位实现。
