# @1-/github_cdn : Branch-sharded static resource CDN storage based on GitHub and jsDelivr

## 功能介绍

本模块提供基于 GitHub 仓库与多 CDN 镜像的去重、预热与高可用静态资源分发服务。

- **内容寻址去重**：使用 MD5 Base64url 散列值作为唯一标识，自动跳过已存在的资源。
- **分支分片存储**：散列值前两位作为 GitHub 分支名，剩余部分与后缀组成文件路径，将文件均匀分布至 256 个轻量分支，规避单分支性能瓶颈与容量限制。
- **智能分支管理**：上传时若目标分支不存在，自动基于主分支最新提交创建；主分支缺失时，自动探测仓库默认分支并创建 "main" 分支。
- **多 CDN 预热探测**：内置多 CDN 镜像生成器（优先 `jsdmirror.cn`，并包含 `fastly.jsdelivr.net`、`cdn.jsdelivr.net`、`cdn.jsdmirror.com`、`gcore.jsdelivr.net`、`testingcf.jsdelivr.net`），按序检查与预热缓存，返回首个可用 CDN 链接。

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
// 输出: //jsdmirror.cn/gh/owner/repo@39/bW84b3JpZ2luYWw.txt
```

## 设计思路

系统以 Git 分支为隔离单元，以文件内容散列为路由键，实现无状态、可水平扩展的静态资源托管与多源 CDN 探测。

```mermaid
graph TD
    Start([开始]) --> Hash[计算数据 MD5 Base64url 散列值]
    Hash --> Split[拆分前2位与剩余部分]
    Split --> BranchName[前2位作为分支名]
    Split --> FileName[剩余部分 + 后缀作为文件路径]
    BranchName & FileName --> CDNUrl[生成多 CDN 候选列表]
    CDNUrl --> CheckExist{按序预检 CDN 缓存}

    CheckExist -- 命中 --> ReturnUrl[返回可用 CDN URL]
    CheckExist -- 未命中 --> Base64[数据转 Base64]

    Base64 --> Upload[GitHub API 写入文件]
    Upload --> CheckStatus{解析响应状态}

    CheckStatus -- 200/201 --> Warmup[按序预热并检查 CDN 镜像]
    CheckStatus -- 404 --> EnsureMain[获取主分支最新 SHA]
    CheckStatus -- 409/422 --> Warmup
    CheckStatus -- 其它 --> ThrowErr[抛出异常]

    EnsureMain --> CreateBranch[创建目标分支]
    CreateBranch --> RetryUpload[重试写入]
    RetryUpload --> CheckRetry{解析重试状态}
    CheckRetry -- 200/201 --> Warmup
    CheckRetry -- 409/422 --> Warmup
    CheckRetry -- 其它 --> ThrowErr

    Warmup --> ReturnUrl
```

## 技术栈

- **Runtime**: Bun
- **CDN**: JSDMirror (`jsdmirror.cn`), jsDelivr (`fastly.jsdelivr.net`, `cdn.jsdelivr.net`, `cdn.jsdmirror.com`, `gcore.jsdelivr.net`, `testingcf.jsdelivr.net`)
- **API**: GitHub REST API (`/repos/{owner}/{repo}/contents/{path}`, `/repos/{owner}/{repo}/git/refs`, `/repos/{owner}/{repo}`)
- **核心依赖**:
  - `@3-/base64url`: 安全散列与编码
  - `@1-/url_exist`: CDN 资源在线性检测
  - `@3-/req`: 轻量级 HTTP 请求封装

## 代码结构

```
src/
├── _.js           # 上传主流程：散列、预检、写入、分支容错、预热探测
├── CDN.js         # 多 CDN 镜像 URL 生成器 (Generator)
├── createBranch.js# GitHub 分支创建逻辑
├── ensureMain.js  # 主分支探测与兜底创建
├── ifElse.js      # 统一错误处理与流程分支包装
├── putContent.js  # GitHub 文件内容写入封装
└── req.js         # GitHub API 请求上下文初始化
```

## 历史故事

GitHub 对单仓库大小（通常 1–5 GB）和单目录文件数量有严格限制。早期开发者直接将大量图片或构建产物提交至 `main` 分支，导致 Git 操作缓慢、克隆失败，甚至收到 GitHub 官方警告。

本方案采用分支分片（branch sharding）策略，将每个文件散列映射至独立分支。由于 Git 分支仅为轻量指针，且各分支历史完全解耦，此设计在不增加存储开销的前提下，彻底消除了单点性能瓶颈，为开源项目提供了稳定、无限容量的静态资源托管基础设施。