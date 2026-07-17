[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @1-/github_cdn : Branch-sharded file CDN storage based on GitHub and jsDelivr

- [@1-/github_cdn : Branch-sharded file CDN storage based on GitHub and jsDelivr](#1-github_cdn-branch-sharded-file-cdn-storage-based-on-github-and-jsdelivr)
  - [Features](#features)
  - [Usage](#usage)
  - [Design Concept](#design-concept)
  - [Tech Stack](#tech-stack)
  - [Code Structure](#code-structure)
  - [History Story](#history-story)
  - [About](#about)

## Features

This module provides deduplicated, highly available static resource distribution using GitHub repositories and jsDelivr CDN.

- **Content-Addressed Deduplication**: Uses MD5 Base64url hash as a unique identifier; skips upload if the resource already exists.
- **Branch-Sharded Storage**: First two characters of the hash form the GitHub branch name; the remainder plus extension forms the file path. Distributes files across 256 lightweight branches to bypass single-branch performance and capacity limits.
- **Intelligent Branch Management**: Automatically creates the target branch from the main branch’s latest commit if missing. Falls back to detecting and setting the repository’s default branch if `main` is absent.
- **Fast Response**: Pre-checks CDN URL existence via HTTP HEAD request before upload; returns immediately if present, avoiding redundant network traffic and writes.

## Usage

```bash
npm install @1-/github_cdn
```

```javascript
import cdnUpload from "@1-/github_cdn";

// Initialize the upload function
const upload = cdnUpload(process.env.GITHUB_TOKEN, "owner/repo");

// Upload data
const buf = Buffer.from("hello world");
const url = await upload(buf, "txt");

console.log(url);
// Output: //cdn.jsdmirror.com/gh/owner/repo@39/bW84b3JpZ2luYWw.txt
```

## Design Concept

The system uses Git branches as isolation units and file content hashes as routing keys, enabling stateless, horizontally scalable static asset hosting.

```mermaid
graph TD
    Start([Start]) --> Hash[Calculate MD5 Base64url hash of data]
    Hash --> Split[Split into first 2 chars and rest]
    Split --> BranchName[First 2 chars as branch name]
    Split --> FileName[Rest + extension as file path]
    BranchName & FileName --> CDNUrl[Generate jsDelivr URL]
    CDNUrl --> CheckExist{Pre-check CDN URL}

    CheckExist -- Exists --> ReturnUrl[Return CDN URL]
    CheckExist -- Not Exists --> Base64[Encode data as Base64]

    Base64 --> Upload[Write file via GitHub API]
    Upload --> CheckStatus{Parse response status}

    CheckStatus -- 200/201 --> ReturnUrl
    CheckStatus -- 404 --> EnsureMain[Get latest SHA of main branch]
    CheckStatus -- 409/422 --> ReturnUrl
    CheckStatus -- Other --> ThrowErr[Throw exception]

    EnsureMain --> CreateBranch[Create target branch]
    CreateBranch --> RetryUpload[Retry write]
    RetryUpload --> CheckRetry{Parse retry status}
    CheckRetry -- 200/201 --> ReturnUrl
    CheckRetry -- 409/422 --> ReturnUrl
    CheckRetry -- Other --> ThrowErr
```

## Tech Stack

- **Runtime**: Bun
- **CDN**: jsDelivr
- **API**: GitHub REST API (`/repos/{owner}/{repo}/contents/{path}`, `/repos/{owner}/{repo}/git/refs`)
- **Core Dependencies**:
  - `@3-/base64url`: Secure hashing and encoding
  - `@1-/url_exist`: CDN resource liveness detection
  - `@3-/req`: Lightweight HTTP request wrapper

## Code Structure

```
src/
├── _.js           # Main upload flow: hashing, pre-check, writing, branch fallback
├── cdn.js         # jsDelivr URL generator
├── createBranch.js# GitHub branch creation logic
├── ensureMain.js  # Main branch detection and fallback creation
├── ifElse.js      # Unified error handling and control flow wrapper
├── putContent.js  # GitHub file content write encapsulation
└── req.js         # GitHub API request context initialization
```

## History Story

GitHub enforces strict limits on repository size (typically 1–5 GB) and file count per directory. Early developers committing large numbers of images or build artifacts directly to the `main` branch experienced severe Git performance degradation, failed clones, and official GitHub warnings.

This solution employs branch sharding: each file’s hash deterministically maps to a dedicated branch. Because Git branches are lightweight pointers and histories are fully decoupled, this design eliminates single-point bottlenecks without increasing storage overhead—providing open-source projects with a stable, infinite-capacity static asset hosting infrastructure.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI

---

<a id="zh"></a>

# @1-/github_cdn : 基于 GitHub 与 jsDelivr 分支分片的文件 CDN 存储方案

- [@1-/github_cdn : 基于 GitHub 与 jsDelivr 分支分片的文件 CDN 存储方案](#1-github_cdn-基于-github-与-jsdelivr-分支分片的文件-cdn-存储方案)
  - [功能介绍](#功能介绍)
  - [使用演示](#使用演示)
  - [设计思路](#设计思路)
  - [技术栈](#技术栈)
  - [代码结构](#代码结构)
  - [历史故事](#历史故事)
  - [关于](#关于)

## 功能介绍

本模块提供基于 GitHub 仓库和 jsDelivr CDN 的去重、高可用静态资源分发服务。

- **内容寻址去重**：使用 MD5 Base64url 散列值作为唯一标识，自动跳过已存在的资源。
- **分支分片存储**：散列值前两位作为 GitHub 分支名，剩余部分与后缀组成文件路径，将文件均匀分布至 256 个轻量分支，规避单分支性能瓶颈与容量限制。
- **智能分支管理**：上传时若目标分支不存在，自动基于主分支最新提交创建；主分支缺失时，自动探测并设置默认分支。
- **极速响应**：上传前通过 HTTP HEAD 请求预检 CDN 链接，存在则直接返回，避免冗余网络请求与写入操作。

## 使用演示

```bash
npm install @1-/github_cdn
```

```javascript
import cdnUpload from "@1-/github_cdn";

// 初始化上传函数
const upload = cdnUpload(process.env.GITHUB_TOKEN, "owner/repo");

// 上传数据
const buf = Buffer.from("hello world");
const url = await upload(buf, "txt");

console.log(url);
// 输出: //cdn.jsdmirror.com/gh/owner/repo@39/bW84b3JpZ2luYWw.txt
```

## 设计思路

系统以 Git 分支为隔离单元，以文件内容散列为路由键，实现无状态、可水平扩展的静态资源托管。

```mermaid
graph TD
    Start([开始]) --> Hash[计算数据 MD5 Base64url 散列值]
    Hash --> Split[拆分前2位与剩余部分]
    Split --> BranchName[前2位作为分支名]
    Split --> FileName[剩余部分 + 后缀作为文件路径]
    BranchName & FileName --> CDNUrl[生成 jsDelivr URL]
    CDNUrl --> CheckExist{预检 CDN URL}

    CheckExist -- 存在 --> ReturnUrl[返回 CDN URL]
    CheckExist -- 不存在 --> Base64[数据转 Base64]

    Base64 --> Upload[GitHub API 写入文件]
    Upload --> CheckStatus{解析响应状态}

    CheckStatus -- 200/201 --> ReturnUrl
    CheckStatus -- 404 --> EnsureMain[获取主分支最新 SHA]
    CheckStatus -- 409/422 --> ReturnUrl
    CheckStatus -- 其它 --> ThrowErr[抛出异常]

    EnsureMain --> CreateBranch[创建目标分支]
    CreateBranch --> RetryUpload[重试写入]
    RetryUpload --> CheckRetry{解析重试状态}
    CheckRetry -- 200/201 --> ReturnUrl
    CheckRetry -- 409/422 --> ReturnUrl
    CheckRetry -- 其它 --> ThrowErr
```

## 技术栈

- **Runtime**: Bun
- **CDN**: jsDelivr
- **API**: GitHub REST API (`/repos/{owner}/{repo}/contents/{path}`, `/repos/{owner}/{repo}/git/refs`)
- **核心依赖**:
  - `@3-/base64url`: 安全散列与编码
  - `@1-/url_exist`: CDN 资源在线性检测
  - `@3-/req`: 轻量级 HTTP 请求封装

## 代码结构

```
src/
├── _.js           # 上传主流程：散列、预检、写入、分支容错
├── cdn.js         # jsDelivr URL 生成器
├── createBranch.js# GitHub 分支创建逻辑
├── ensureMain.js  # 主分支探测与兜底创建
├── ifElse.js      # 统一错误处理与流程分支包装
├── putContent.js  # GitHub 文件内容写入封装
└── req.js         # GitHub API 请求上下文初始化
```

## 历史故事

GitHub 对单仓库大小（通常 1–5 GB）和单目录文件数量有严格限制。早期开发者直接将大量图片或构建产物提交至 `main` 分支，导致 Git 操作缓慢、克隆失败，甚至收到 GitHub 官方警告。

本方案采用分支分片（branch sharding）策略，将每个文件散列映射至独立分支。由于 Git 分支仅为轻量指针，且各分支历史完全解耦，此设计在不增加存储开销的前提下，彻底消除了单点性能瓶颈，为开源项目提供了稳定、无限容量的静态资源托管基础设施。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
