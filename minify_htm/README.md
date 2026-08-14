[English](#en) | [中文](#zh)

---

<a id="en"></a>
# @1-/minify_htm : Lightweight HTML minification with script tag fixes

- [@1-/minify_htm : Lightweight HTML minification with script tag fixes](#1-minify_htm-lightweight-html-minification-with-script-tag-fixes)
  - [Functionality](#functionality)
  - [Usage demonstration](#usage-demonstration)
  - [Design rationale](#design-rationale)
  - [Technology stack](#technology-stack)
  - [Code structure](#code-structure)
  - [Historical context](#historical-context)
  - [About](#about)

## Functionality
Minifies HTML content while preserving essential functionality and fixing script tag closing issues. Addresses the common problem where minification incorrectly transforms `</script>` into `;</script>`, which breaks browser parsing.

## Usage demonstration
Install the package:
```bash
npm install @1-/minify_htm
```

Use in JavaScript:
```javascript
import minify from '@1-/minify_htm';

const html = '<html><body><script>console.log("hello");</script></body></html>';
const minified = minify(html);
console.log(minified);
// Output: <html><body><script>console.log("hello");</script></body></html>
```

## Design rationale
The package wraps the robust `@minify-html/node` library with targeted configuration and post-processing to ensure compatibility with modern browsers.

```mermaid
graph TD
    A[Input HTML string] --> B[Encode to Uint8Array]
    B --> C[Minify with @minify-html/node]
    C --> D[Decode back to string]
    D --> E[Fix script tag closing]
    E --> F[Output minified HTML]
```

## Technology stack
- Core minifier: `@minify-html/node`
- Runtime: Modern Node.js (ESM modules)
- Encoding: `TextEncoder`/`TextDecoder` for efficient string conversion

## Code structure
```
src/
├── _.js          # Main entry point exporting minify function
```

## Historical context
HTML minification emerged in the early 2010s as web performance optimization became critical. The first widely adopted tools like HTMLMinifier appeared around 2012, addressing the need to reduce bandwidth usage and improve page load times. Modern minifiers evolved to handle complex edge cases like script tag parsing, which remains challenging due to HTML's forgiving parser specifications.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# @1-/minify_htm : 轻量级 HTML 压缩并修复脚本标签闭合

- [@1-/minify_htm : 轻量级 HTML 压缩并修复脚本标签闭合](#1-minify_htm-轻量级-html-压缩并修复脚本标签闭合)
  - [功能特性](#功能特性)
  - [使用示例](#使用示例)
  - [设计思路](#设计思路)
  - [技术栈](#技术栈)
  - [代码结构](#代码结构)
  - [历史背景](#历史背景)
  - [关于](#关于)

## 功能特性
压缩 HTML 内容同时保持核心功能正常，并修正脚本标签闭合问题。解决压缩过程中将 `</script>` 错误转换为 `;</script>` 导致浏览器解析失败的常见问题。

## 使用示例
安装包：
```bash
npm install @1-/minify_htm
```

JavaScript 中使用：
```javascript
import minify from '@1-/minify_htm';

const html = '<html><body><script>console.log("hello");</script></body></html>';
const minified = minify(html);
console.log(minified);
// 输出: <html><body><script>console.log("hello");</script></body></html>
```

## 设计思路
该包封装了健壮的 `@minify-html/node` 库，通过针对性配置和后处理确保与现代浏览器兼容。

```mermaid
graph TD
    A[输入 HTML 字符串] --> B[编码为 Uint8Array]
    B --> C[使用 @minify-html/node 压缩]
    C --> D[解码回字符串]
    D --> E[修正脚本标签闭合]
    E --> F[输出压缩后的 HTML]
```

## 技术栈
- 核心压缩器：`@minify-html/node`
- 运行时：现代 Node.js（ESM 模块）
- 编码：`TextEncoder`/`TextDecoder` 实现高效字符串转换

## 代码结构
```
src/
├── _.js          # 主入口文件，导出 minify 函数
```

## 历史背景
HTML 压缩技术在 2010 年代初随网页性能优化需求兴起。首个广泛采用的工具 HTMLMinifier 于 2012 年左右出现，旨在降低带宽消耗并提升页面加载速度。现代压缩器逐步演进以处理脚本标签解析等复杂边缘情况，这始终是挑战性课题，源于 HTML 解析器规范的宽容特性。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

