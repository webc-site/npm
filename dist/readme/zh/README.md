# @1-/dist : Monorepo 包发布自动化与 Git 分支同步

## 功能介绍

- **Knip 静态分析**
  发布前执行 Knip 静态分析，检测无用导出、缺失声明、冗余依赖及其他问题，覆盖 `files`、`dependencies`、`devDependencies`、`optionalPeerDependencies`、`unlisted`、`binaries`、`unresolved`、`exports`、`nsExports`、`types`、`nsTypes`、`enumMembers`、`namespaceMembers`、`duplicates`、`catalog` 等 15 类问题。

- **大语言模型元数据生成**
  检测 `package.json` 中 `description` 与 `keywords` 字段缺失。
  使用本地配置的 LLM 服务（通过 `~/.config/OPENAI.js` 配置，格式为 `[base_url, api_key, model]`），通过 OpenAI 兼容 API 生成文档并补全元数据。
  加载 `src/prompt/readme.eta` 中的提示模板，并执行 Markdown 路径校验与自动修复循环。

- **Git 工作区管理**
  使用 `simple-git` 检测仓库状态。
  发布前自动提交未暂存修改。

- **沙箱化发布环境**
  使用 `os.tmpdir()` 创建隔离临时目录，名称包含密码学随机标识符（`crypto.randomUUID()`）。
  仅递归复制 `src` 目录内容。
  清理 `package.json`，移除 `devDependencies`、`scripts`、`files`、`lint-staged` 字段。
  使用 `srcReplace` 重写 `exports`、`bin`、`files`、`main`、`module`、`types` 字段中的相对路径。

- **Mermaid 图表处理**
  解析 `README.mdt` 文件中的 Mermaid 图表。
  渲染为 SVG 格式并上传至 GitHub CDN 使用 `@1-/github_cdn`。
  在生成的 Markdown 中替换图表块为 CDN 链接。
  同时更新源目录、临时目录及 `src` 目录（如指定）的 README 文件。

- **自动化 npm 发布**
  在临时目录中执行 `npm publish --access public`。
  发布成功后自动递增修补版本号（例如 `1.2.3` → `1.2.4`）。
  使用平台适配命令在默认浏览器中打开 npm 包页面（`open`、`cmd.exe` 或 `xdg-open`）。

- **多分支 Git 同步**
  提交并推送变更至 `dev` 分支，提交信息为 `"v1.2.4"`。
  使用 `git clone --shared` 实现高效、安全的合并操作。
  将本地仓库克隆至临时路径，检出 `main` 分支，拉取最新代码，合并 `dev` 分支，最后推送至远程仓库。
  自动更新 `.gitignore` 添加 `/tmp/` 条目以防止意外提交。

## 使用演示

命令行指定要发布的包目录名称：

```bash
dist <pkg_folder>
```

示例：

```bash
dist walk
```

CLI 使用 yargs 进行参数解析，要求且仅接受一个位置参数，指定包目录名称。

## 设计思路

```mermaid
graph TD
    Start([开始]) --> Knip[Knip 静态分析]
    Knip --> Metadata[LLM 元数据生成]
    Metadata --> Gci[Git 工作区提交]
    Gci --> Prep[沙箱准备]
    Prep --> Clean[package.json 清理]
    Clean --> Readme[README 处理]
    Readme --> Publish[npm 发布]
    Publish --> Version[版本更新]
    Version --> Dev[推送至 dev 分支]
    Dev --> Main[合并至 main 分支]
    Main --> End([结束])
```

工作流遵循严格的顺序执行，每个阶段均有错误处理。Knip 检查失败将立即终止进程并输出详细错误报告。所有临时目录均在 `finally` 块中清理。

## 技术栈

- **Bun**: 运行时与包管理器（替代 Node.js）
- **Simple Git**: Git 操作库
- **Knip**: JavaScript/TypeScript 项目静态分析工具
- **Yargs**: 命令行参数解析
- **GitHub CDN**: 云存储集成，用于图表托管
- **Mermaid**: 图表渲染引擎
- **Eta**: 模板引擎，用于 LLM 提示生成
- **@1-/github_cdn**: GitHub CDN 上传封装
- **@1-/mdt**: Markdown template renderer
- **@3-/log**: 日志记录工具
- **@1-/findgit**: Git root directory finder

## 代码结构

```text
src/
├── dist.js          # CLI 入口，使用 yargs 参数解析
├── exec.js          # 子进程命令执行器，用于 shell 命令
├── gci.js           # Git 工作区检查器，基于 simple-git
├── gitMerge.js      # 共享克隆 Git 合并器，使用 .tmp 目录隔离
├── gitSync.js       # Git 分支同步控制器
├── knip.js          # Knip 静态分析控制器，支持 15 类问题检测
├── pkgJsonClean.js  # 清理 package.json 并重写导出路径
├── prep.js          # 沙箱目录预处理器，使用 crypto.randomUUID()
├── publish.js       # npm 发布器，支持跨平台浏览器打开
├── readme.js        # Markdown 渲染器与 Mermaid 处理器
├── readmeGen.js     # 大语言模型文档生成器，集成 LLM 配置
├── run.js           # 发布流程主控制器
├── srcReplace.js    # 相对路径重写器，用于 package.json 字段
└── svg.js           # SVG 渲染器与上传器，用于 Mermaid 图表
```

## 历史故事

早期 Node.js 包发布依赖 `npm publish` 上传整个目录，频繁导致 `.env` 敏感配置、凭证文件及测试资源泄露。尽管 `.npmignore` 和 `files` 白名单机制提供了缓解方案，但配置过程仍需手动操作且易出错。

Monorepo 架构下的 Git 工作流要求开发者手动管理多分支同步，包括 `git checkout`、`pull`、`merge` 和 `push` 等命令。未提交的本地修改使这些操作更加复杂，增加了合并冲突风险和污染提交历史的可能性。

本工具通过 Git 共享克隆（`git clone --shared`）与沙箱化发布解决上述挑战。临时目录隔离从根本上杜绝了意外文件包含，而自动化的 Git 同步流水线确保了零配置的安全发布体验。架构从简单的 Shell 脚本包装器演变为模块化的 Bun 系统，各关注点分离，支持大规模 Monorepo 的可靠发布。