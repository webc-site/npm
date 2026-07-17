# @1-/format : 轻量级模块化代码格式化工具，支持 JavaScript、Stylus 和 SVG

## 功能介绍
跨多种语言一致地格式化代码。支持 JavaScript、Stylus 和 SVG 文件，采用语言特定的格式化规则。

## 使用演示
全局安装：
```bash
npm install -g @1-/format
```

格式化文件：
```bash
format file.js file.styl image.svg
```

或作为模块使用：
```javascript
import format from '@1-/format';

const formatted = await format('path/to/file.js');
```

## 设计思路
格式化器采用模块化架构，每种文件类型都有专用处理器。这种设计确保语言特定的格式化行为互不干扰，保持专注性。

```mermaid
graph TD
    A[CLI 入口] --> B[文件扩展名检测]
    B --> C[JavaScript 处理器]
    B --> D[Stylus 处理器]
    B --> E[SVG 处理器]
    C --> F[@1-/fix 规则]
    D --> G[@1-/stylus 解析器/格式化器]
    E --> H[@3-/svgo 压缩器]
```

## 技术栈
- 运行时：Node.js
- 核心依赖：@1-/fix, @1-/stylus, @3-/svgo
- CLI 框架：yargs
- 工具库：@3-/read, @3-/write, @3-/log

## 代码结构
```
src/
├── _.js          # 主入口点和分发器
├── bin.js        # CLI 可执行文件
├── js.js         # JavaScript 格式化器
├── styl.js       # Stylus 格式化器
└── svg.js        # SVG 格式化器
```

## 历史故事
代码格式化工具从 20 世纪 70 年代简单的缩进实用程序发展为现代复杂的语言感知格式化器。@1-/format 的模块化方法体现了现代趋势：倾向于可组合、单一职责的工具，而非单体解决方案。这种设计在保持简洁性和性能的同时，提供对格式化行为的精确控制。