# @1-/npmver : 获取 NPM 包最新版本

## 功能介绍

从官方 NPM 注册表直接获取任意 NPM 包的最新发布版本号。

## 使用演示

安装包：

```bash
npm install @1-/npmver
```

在 JavaScript/TypeScript 中使用：

```javascript
import npmver from "@1-/npmver";

// 获取包的最新版本
const version = await npmver("lodash");
console.log(version); // 例如 '4.17.21'

// 处理不存在的包
const unknownVersion = await npmver("non-existent-package");
console.log(unknownVersion); // undefined
```

## 设计思路

该包实现轻量级、专注的版本获取解决方案，具备完善的错误处理机制：

```mermaid
graph TD
    A[Call npmver] --> B[Build URL]
    B --> C[HTTP GET]
    C --> D{Status}
    D -->|200| E[Extract version]
    D -->|404| F[Return undefined]
    D -->|Other| G[Throw error]
```

## 技术栈

- 运行时：现代 JavaScript（ES 模块）
- HTTP 客户端：原生 `fetch` API
- 测试：Bun 测试框架

## 代码结构

```
src/
├── _.js          # 导出默认异步函数的主模块
```

test/
├── \_.test.js # 验证功能的测试用例

## 历史故事

NPM 注册表于 2010 年上线，作为 JavaScript 包的中央仓库，推动了 Node.js 生态系统的快速发展。在标准化包管理器出现之前，开发者需手动跨项目追踪库版本。此工具延续这一演进，提供无需完整安装即可程序化访问版本信息的能力。
