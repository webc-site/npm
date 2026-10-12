# @1-/mdimg2cdn : 将本地 Markdown 图片转换为 CDN 链接

## 功能介绍

@1-/mdimg2cdn 处理 Markdown 文档，识别本地图片引用并替换为 CDN 托管的 URL。支持 Markdown 语法（`![alt](path/to/image.png)`）和 HTML `<img>` 标签，同时智能跳过代码块与行内代码以避免错误替换。

工具集成 Mermaid 图表渲染，将生成的 SVG 图片上传至 CDN，确保在不同环境中呈现一致的视觉效果。

## 使用演示

作为 CLI 工具安装：

```bash
npm install -g @1-/mdimg2cdn
```

处理 Markdown 文件并输出到标准输出：

```bash
mdimg2cdn README.md
```

将更改写回原始文件：

```bash
mdimg2cdn README.md --write
```

在 JavaScript 中作为库使用：

```javascript
import mdimg2cdn from "@1-/mdimg2cdn";

const processedMd = await mdimg2cdn(
  markdownContent,
  async (buffer, ext) => {
    // 自定义 CDN 上传逻辑
    return "https://cdn.example.com/image.png";
  },
  "/path/to/base/directory"
);
```

## 设计思路

架构采用管道模式，关注点分离清晰：

```mermaid
graph TD
    A[输入 Markdown] --> B[解析图片 URL]
    B --> C[筛选本地 URL]
    C --> D[上传至 CDN]
    D --> E[在原始内容中替换 URL]
    E --> F[输出处理后的 Markdown]
```

关键设计考量：

- 状态机解析，确保从 Markdown 和 HTML 语法中稳健提取图片 URL
- 代码块与行内代码检测，防止在代码示例中产生误匹配
- Mermaid 集成，支持动态图表渲染
- 异步处理，高效管理文件 I/O 和网络操作

## 技术栈

- 运行时：bun（ES 模块）
- 核心依赖：`@1-/md/li.js`, `@1-/md/code.js`, `@1-/mdmermaid`, `@1-/read`, `@1-/findgit`, `@1-/github_cdn`
- CLI 框架：yargs

## 代码结构

```
src/
├── _.js          # 主转换函数，协调解析、上传与替换流程
├── cli.js        # 命令行接口，处理参数、路径解析与配置加载
└── parse.js      # Markdown 与 HTML 图片 URL 解析状态机
```

核心模块（`_.js`）实现主转换逻辑，`cli.js` 负责 CLI 入口与 GitHub CDN 配置加载，`parse.js` 提供专用状态机以精确提取图片 URL。

## 历史故事

内容分发网络（CDN）概念诞生于 20 世纪 90 年代末。1998 年成立的 Akamai Technologies 开创性地采用分布式边缘服务器架构部署 CDN，旨在解决因用户与源服务器地理距离导致的网页性能瓶颈。Akamai 的技术基础源于麻省理工学院教授 Tom Leighton 及其团队的研究，其算法有效优化了互联网内容的路由与缓存策略。如今 @1-/mdimg2cdn 等现代 Markdown 工具构建于这一基础设施之上，使开发者无需手动管理图片即可享受 CDN 带来的性能优势。
