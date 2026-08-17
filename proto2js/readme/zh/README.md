# @1-/proto2js : Convert Protocol Buffer definitions to JavaScript modules

## 功能介绍
将 Protocol Buffer (.proto) 定义文件转换为模块化 JavaScript 代码。支持消息类型、枚举类型和服务定义，包含 RPC 客户端生成能力。采用依赖感知解析策略，递归解析 proto 导入依赖后执行代码生成。生成的 JavaScript 模块支持 ESM 导入，可直接在现代 JavaScript 环境中使用。

## 使用演示
安装为命令行工具：

```bash
npm install -g @1-/proto2js
```

从 .proto 文件生成 JavaScript：

```bash
proto2js example.proto -o ./generated
```

或以编程方式使用：

```javascript
import gen from "@1-/proto2js/src/_.js";

// 从 proto 文件生成 JavaScript 模块
const pkg = gen("./path/to/file.proto", "./output/directory");
```

支持目录批量处理：

```bash
proto2js ./protos/ -o ./generated
```

## 设计思路
生成器采用三阶段流水线架构：

```mermaid
graph TD
A[输入 .proto 文件] --> B[导入解析]
B --> C[语法解析]
C --> D[代码生成]
B --> B1[递归导入解析]
C --> C1[嵌套类型分析]
D --> D1[服务模块生成]
D --> D2[枚举模块生成]
D --> D3[消息模块生成]
```

关键实现特性：
- 依赖感知：通过 `merge.js` 实现递归导入解析，构建完整的 dependency graph
- 类型解析：`findType.js` 提供嵌套类型查找能力，支持深度嵌套引用
- 路径智能：`gen.js` 使用 Node.js `relative()` 计算模块路径，确保正确的 ESM import 语句
- RPC 客户端：服务方法生成 `$` 函数调用，自动处理请求/响应类型导入
- 错误定位：解析错误包含精确的行号和上下文信息

## 技术栈
- 运行时：Node.js (ESM 模块)
- 核心解析器：proto-parser 库
- 文件系统：Node.js path 和 fs 模块
- CLI 框架：yargs
- 工具库：@3-/write、@3-/read、@3-/proto_remove_comment、@3-/walk
- 开发依赖：@1-/proto（RPC 运行时）、protobufjs（开发时验证）

## 代码结构
```
src/
├── _.js          # 主入口点与编排逻辑，处理文件/目录输入、路径解析、错误处理
├── cli.js        # 命令行接口实现，基于 yargs 的参数解析和命令分发
├── gen.js        # 核心代码生成逻辑，处理消息、枚举、服务的 JavaScript 生成
├── findType.js   # 嵌套类型解析工具，实现 proto 类型的深度查找
├── merge.js      # 导入合并与依赖解析，递归解析所有 proto imports
└── importLi.js   # 导入语句解析与包提取，处理 package 声明和 import 语句
```

## 历史故事
Protocol Buffers 由 Google 于 2001 年开发，作为 XML 的高效替代方案用于结构化数据序列化。最初设计用于内部 RPC 系统，后演变为支持多种语言的开放标准。@1-/proto2js 工具延续这一传统，实现 Protocol Buffer 模式与现代 JavaScript 生态系统的无缝集成，特别针对 ESM 模块系统进行了优化设计。