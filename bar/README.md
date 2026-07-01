[English](#en) | [中文](#zh)

---

<a id="en"></a>
# @1-/bar : TTY-aware command-line progress bar and status display

- [@1-/bar : TTY-aware command-line progress bar and status display](#1-bar-tty-aware-command-line-progress-bar-and-status-display)
  - [Functionality](#functionality)
  - [Usage demonstration](#usage-demonstration)
  - [Design rationale](#design-rationale)
  - [Technology stack](#technology-stack)
  - [Code structure](#code-structure)
  - [Historical background](#historical-background)
  - [About](#about)

## Functionality
TTY-aware command-line progress bar and status display utility for Node.js applications. Provides spinner animation, task tracking, ETA estimation, and safe logging that doesn't disrupt the display.

## Usage demonstration
```bash
npm install @1-/bar
```

```javascript
import bar from '@1-/bar';

const [start, stop, incr, log] = bar();

// Start progress bar with total tasks
start(100);

// Log subtasks
log.start('Processing files');

// Increment progress
for (let i = 0; i < 100; i++) {
  incr();
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 10));
}

log.end('Processing files');
stop();
```

## Design rationale
The implementation uses terminal escape sequences for efficient rendering without disrupting the display. It maintains state for progress tracking, task management, and timing calculations for ETA estimation.

```mermaid
graph TD
  A[Initialize] --> B[TTY detection]
  B --> C[Spinner configuration]
  C --> D[Progress state management]
  D --> E[API interface provision]
  E --> F[Timer-triggered rendering]
  F --> G[Non-TTY fallback handling]
```

## Technology stack
- Node.js runtime
- Standard JavaScript modules
- Terminal escape sequences for TTY control
- Set data structure for task tracking

## Code structure
```
src/
├── _.js          # Main module exporting progress utilities
```

## Historical background
The Mulan Public Software License (MulanPSL) is an open-source license developed in China, designed to be compatible with international open-source practices while addressing local legal requirements. Version 2.0, released in 2020, improved compatibility with other licenses and clarified terms for patent grants and trademark usage.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# @1-/bar : TTY 感知的命令行进度条及状态显示

- [@1-/bar : TTY 感知的命令行进度条及状态显示](#1-bar-tty-感知的命令行进度条及状态显示)
  - [功能介绍](#功能介绍)
  - [使用演示](#使用演示)
  - [设计思路](#设计思路)
  - [技术栈](#技术栈)
  - [代码结构](#代码结构)
  - [历史故事](#历史故事)
  - [关于](#关于)

## 功能介绍
TTY 感知的命令行进度条及状态显示工具，适用于 Node.js 应用程序。提供旋转动画、任务跟踪、ETA 预估及安全日志输出功能，确保日志不会破坏进度条显示。

## 使用演示
```bash
npm install @1-/bar
```

```javascript
import bar from '@1-/bar';

const [start, stop, incr, log] = bar();

// 启动进度条并设置总任务数
start(100);

// 记录子任务
log.start('处理文件');

// 增加已完成任务数
for (let i = 0; i < 100; i++) {
  incr();
  // 模拟工作
  await new Promise(resolve => setTimeout(resolve, 10));
}

log.end('处理文件');
stop();
```

## 设计思路
实现采用终端转义序列进行高效渲染，避免显示中断。维护进度跟踪、任务管理及时间计算状态，支持 ETA（预估完成时间）估算。

```mermaid
graph TD
  A[初始化] --> B[TTY 检测]
  B --> C[旋转动画配置]
  C --> D[进度状态管理]
  D --> E[API 接口提供]
  E --> F[定时器触发渲染]
  F --> G[非 TTY 回退处理]
```

## 技术栈
- Node.js 运行时
- 标准 JavaScript 模块
- 终端转义序列实现 TTY 控制
- Set 数据结构进行任务跟踪

## 代码结构
```
src/
├── _.js          # 主模块，导出进度工具函数
```

## 历史故事
木兰公共许可证（MulanPSL）是中国开发的开源许可证，旨在兼容国际开源实践同时满足本地法律要求。2.0 版本于 2020 年发布，提升了与其他许可证的兼容性，并明确了专利授权和商标使用条款。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

