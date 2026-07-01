[English](#en) | [中文](#zh)

---

<a id="en"></a>
# xboot : Async Static Variable Initialization with Priority Support

- [xboot : Async Static Variable Initialization with Priority Support](#xboot-async-static-variable-initialization-with-priority-support)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Design](#design)
    - [Execution Flow](#execution-flow)
    - [Key Mechanisms](#key-mechanisms)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [API Reference](#api-reference)
    - [Data Structures](#data-structures)
    - [Types](#types)
    - [Statics](#statics)
    - [Functions](#functions)
    - [Macros](#macros)
  - [History](#history)
  - [About](#about)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Design](#design)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [History](#history)

## Introduction

xboot executes async initialization of static variables before program execution begins.
Utilizing compile-time collection via linker sections, it groups async tasks by priority and runs them concurrently within each priority level.
This solves dependency ordering issues when initializing resources like databases and services.

## Features

- Async static variable initialization
- Priority-based dependency ordering
- Concurrent task execution within same priority
- Zero-cost compile-time collection via linker sections
- Simple macro-based API
- Full integration with tokio runtime

## Installation

Add to `Cargo.toml`:

```toml
[dependencies]
xboot = "0.1"
```

## Usage

This example demonstrates how priority resolves initialization dependencies.
`UserService` (Priority 1) depends on `Database` (Priority 0) being fully initialized.

```rust
use aok::{OK, Result};
use log::info;
use tokio::time::{Duration, sleep};

// --- Database Module (Priority 0) ---
pub struct Database {}

impl Database {
  pub fn query(&self) -> String {
    "cached_user_roles".to_string()
  }
}

pub async fn connect_db() -> Result<Database> {
  info!("DB: Connecting to database...");
  sleep(Duration::from_secs(2)).await;
  info!("DB: Connection established.");
  Ok(Database {})
}

// Register DB initialization with priority 0 (first)
xboot::init!(DB: Database {
  connect_db().await
}, 0);


// --- Service Module (Priority 1, depends on DB) ---
pub struct UserService {
  pub roles: String,
}

impl UserService {
  pub fn check_roles(&self) {
    info!("UserService: Verified roles: {}", self.roles);
  }
}

pub async fn init_user_service() -> Result<UserService> {
  info!("UserService: Initializing service...");
  // Safely query the already initialized DB static variable
  let roles = DB.query();
  info!("UserService: Loaded config from DB: {}", roles);
  Ok(UserService { roles })
}

// Register service initialization with priority 1 (runs after priority 0 tasks finish)
xboot::init!(USER_SERVICE: UserService {
  init_user_service().await
}, 1);


// --- Main Entry ---
#[tokio::main]
async fn main() -> Result<()> {
  log_init::init();

  info!("Main: Running xboot initialization...");
  xboot::init().await?;
  info!("Main: xboot initialization completed.");

  USER_SERVICE.check_roles();

  OK
}
```

## Design

xboot leverages linker sections via `linkme` to assemble initialization tasks.

### Execution Flow

```mermaid
graph TD
    A[Compile Time: Register tasks via macros] --> B[Link Time: Linker collects BootTasks into ASYNC slice]
    B --> C[Runtime: Call init]
    C --> D[Sort ASYNC slice by priority ascending]
    D --> E[Group tasks by priority level]
    E --> F[Spawn tasks of current priority concurrently]
    F --> G[Await current priority tasks to complete]
    G --> H{More priorities?}
    H -- Yes --> E
    H -- No --> I[Static variables ready]
```

### Key Mechanisms

1. **Linker Collection**: The `init!` and `add!` macros register initialization function pointers and metadata directly into a custom linker section.
2. **Priority Grouping**: The `init()` function runs at startup, sorting all tasks by priority. Tasks of the same priority are executed concurrently to maximize performance.
3. **Lazy Wrapping**: Static variables are wrapped in `Wrap` which dereferences to the underlying `OnceCell`. Accessing the variable before `init()` completes will block or error safely.

## Tech Stack

| Crate | Purpose |
| --- | --- |
| [linkme](https://crates.io/crates/linkme) | Compile-time linker section collection |
| [tokio](https://crates.io/crates/tokio) | Async runtime and task execution |
| [paste](https://crates.io/crates/paste) | Macro identifier concatenation |
| [gensym](https://crates.io/crates/gensym) | Unique symbol generation |
| [aok](https://crates.io/crates/aok) | Ergonomic result handling |

## Project Structure

```
xboot/
├── Cargo.toml
├── src/
│   └── lib.rs      # Core library implementation
└── tests/
    ├── Cargo.toml
    └── src/
        └── main.rs # Priority dependency demonstration
```

## API Reference

### Data Structures

- `BootTask`: Represents registered initialization metadata.
  ```rust
  pub struct BootTask {
    pub priority: i32,
    pub run: AsyncFn,
  }
  ```
- `Wrap<T>`: Safe wrapper around `OnceCell<T>`. Implements `Deref` to provide access to the initialized value.
- `OnceCell<T>`: Thread-safe, async-friendly cell for single initialization.

### Types

- `Task`: Alias for `tokio::task::JoinHandle<Result<()>>`.
- `AsyncFn`: Function pointer type `fn() -> Task`.

### Statics

- `ASYNC`: Distributed slice `[BootTask]` containing all registered tasks.

### Functions

- `init() -> Result<()>`: Collects, sorts, and executes all registered initialization tasks.
- `exit_on_err<T, E: Display>(name: &str, res: Result<T, E>) -> T`: Helper function used by the macro to log error and exit process on failure.

### Macros

- `init!(VAR: Type { init_expr })`: Registers static variable with default priority (0).
- `init!(VAR: Type { init_expr }, priority)`: Registers static variable with custom priority.
- `add!(init_expr)`: Registers async block to run at startup with default priority (0).
- `add!(init_expr, priority)`: Registers async block to run at startup with custom priority.

## History

In systems programming, global static initialization has historically been a source of subtle bugs.
In C++, this issue is notorious as the "static initialization order fiasco".
Because the order of initialization for static variables across different compilation units is undefined, variables depending on each other could be accessed before they were initialized.
This led to undefined behavior, memory corruption, and crashes.

Modern operating systems and compilers introduced constructor segments (such as ELF `.ctors` / `.init` sections on Unix-like systems and PE `.CRT$XCU` on Windows).
These segments allow compilers to register functions to execute before `main` runs.
However, this mechanism runs in a single-threaded, synchronous context, which is incompatible with modern asynchronous runtimes like Tokio.

David Tolnay created the `linkme` crate to provide a safe, cross-platform distributed slice mechanism in Rust, leveraging linker sections.
xboot builds on this foundation by introducing asynchronous task execution and strict priority scheduling.
This allows developers to define complex, interdependent async initializations (such as database connections and service discovery) that resolve deterministically before `main` starts, preventing initialization order issues while maintaining safety and performance.


## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# xboot : 支持优先级的异步静态变量初始化

- [xboot : 支持优先级的异步静态变量初始化](#xboot-支持优先级的异步静态变量初始化)
  - [目录](#目录)
  - [简介](#简介)
  - [特性](#特性)
  - [安装](#安装)
  - [使用](#使用)
  - [设计](#设计)
    - [初始化流程](#初始化流程)
    - [核心机制](#核心机制)
  - [技术栈](#技术栈)
  - [项目结构](#项目结构)
  - [API 参考](#api-参考)
    - [数据结构](#数据结构)
    - [类型](#类型)
    - [静态变量](#静态变量)
    - [函数](#函数)
    - [宏](#宏)
  - [历史](#历史)
  - [关于](#关于)

## 目录

- [简介](#简介)
- [特性](#特性)
- [安装](#安装)
- [使用](#使用)
- [设计](#设计)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [API 参考](#api-参考)
- [历史](#历史)

## 简介

xboot 用于程序启动前异步初始化静态变量。
通过链接器段（Linker Sections）在编译期收集任务，运行时按优先级分组并并发执行，解决数据库、服务等模块间的初始化依赖顺序问题。

## 特性

- 异步静态变量初始化
- 基于优先级的依赖顺序控制
- 同一优先级任务并发执行
- 零运行时开销链接段收集
- 简洁的宏定义 API
- 兼容 tokio 异步运行时

## 安装

在 `Cargo.toml` 中添加：

```toml
[dependencies]
xboot = "0.1"
```

## 使用

下文演示如何通过优先级解决初始化依赖关系。
`UserService` (优先级 1) 的初始化依赖于 `Database` (优先级 0) 的完全就绪。

```rust
use aok::{OK, Result};
use log::info;
use tokio::time::{Duration, sleep};

// --- 数据库模块 (优先级 0，最先初始化) ---
pub struct Database {}

impl Database {
  pub fn query(&self) -> String {
    "cached_user_roles".to_string()
  }
}

pub async fn connect_db() -> Result<Database> {
  info!("DB: Connecting to database...");
  sleep(Duration::from_secs(2)).await;
  info!("DB: Connection established.");
  Ok(Database {})
}

// 注册数据库初始化，优先级为 0
xboot::init!(DB: Database {
  connect_db().await
}, 0);


// --- 用户服务模块 (优先级 1，依赖于数据库) ---
pub struct UserService {
  pub roles: String,
}

impl UserService {
  pub fn check_roles(&self) {
    info!("UserService: Verified roles: {}", self.roles);
  }
}

pub async fn init_user_service() -> Result<UserService> {
  info!("UserService: Initializing service...");
  // 核心依赖展示：此处直接读取并调用已初始化的全局变量 DB
  let roles = DB.query();
  info!("UserService: Loaded startup configuration from DB: {}", roles);
  Ok(UserService { roles })
}

// 注册服务初始化，优先级为 1 (确保在优先级 0 的 DB 初始化完成后再运行)
xboot::init!(USER_SERVICE: UserService {
  init_user_service().await
}, 1);


// --- 主程序入口 ---
#[tokio::main]
async fn main() -> Result<()> {
  log_init::init();

  info!("Main: Running xboot initialization...");
  xboot::init().await?;
  info!("Main: xboot initialization completed.");

  // 调用业务逻辑以验证服务已被成功初始化且成功获取了依赖数据
  USER_SERVICE.check_roles();

  OK
}
```

## 设计

xboot 利用 `linkme` 的分布式切片，在链接期跨 crate 依赖图收集初始化任务。

### 初始化流程

```mermaid
graph TD
    A[编译期: 宏展开注册任务] --> B[链接期: 链接器收集所有 BootTask 到 ASYNC 切片]
    B --> C[运行时: 调用 init]
    C --> D[按优先级升序排序 ASYNC 切片]
    D --> E[分组获取相同优先级的任务]
    E --> F[并发 spawn 当前优先级的所有任务]
    F --> G[等待当前优先级的所有任务完成]
    G --> H{是否还有后续优先级?}
    H -- 是 --> E
    H -- 否 --> I[静态变量初始化完成]
```

### 核心机制

1. **链接期收集**：通过 `init!` 和 `add!` 宏将异步任务指针与优先级元数据直接写入自定义链接器段。
2. **优先级分组**：在运行时启动阶段对任务按优先级排序，同一优先级的任务并发执行以最大化运行效率。
3. **安全包装**：静态变量使用 `Wrap` 包装，内部指向 `OnceCell`。初始化未完成时访问将触发安全阻塞或报错。

## 技术栈

| Crate | 用途 |
| --- | --- |
| [linkme](https://crates.io/crates/linkme) | 分布式切片，编译期收集 |
| [tokio](https://crates.io/crates/tokio) | 异步运行时与任务派发 |
| [paste](https://crates.io/crates/paste) | 宏标识符拼接 |
| [gensym](https://crates.io/crates/gensym) | 唯一符号生成 |
| [aok](https://crates.io/crates/aok) | 结果类型处理工具 |

## 项目结构

```
xboot/
├── Cargo.toml
├── src/
│   └── lib.rs      # 核心实现
└── tests/
    ├── Cargo.toml
    └── src/
        └── main.rs # 依赖依赖性演练示例
```

## API 参考

### 数据结构

- `BootTask`：引导初始化任务结构体，包含优先级与初始化函数。
  ```rust
  pub struct BootTask {
    pub priority: i32,
    pub run: AsyncFn,
  }
  ```
- `Wrap<T>`：安全包装器，包装 `OnceCell<T>`，实现 `Deref` 以提供对初始化后值的访问。
- `OnceCell<T>`：线程安全、支持异步的单次初始化单元。

### 类型

- `Task`：`tokio::task::JoinHandle<Result<()>>` 类型别名。
- `AsyncFn`：`fn() -> Task` 函数指针。

### 静态变量

- `ASYNC`：存储所有已注册 `BootTask` 的分布式切片。

### 函数

- `init() -> Result<()>`：排序并并发执行所有注册的初始化任务。
- `exit_on_err<T, E: Display>(name: &str, res: Result<T, E>) -> T`：辅助函数，用于初始化失败时记录错误日志并退出进程。

### 宏

- `init!(VAR: Type { init_expr })`：以默认优先级 (0) 注册静态变量。
- `init!(VAR: Type { init_expr }, priority)`：以自定义优先级注册静态变量。
- `add!(init_expr)`: 注册默认优先级 (0) 的异步初始化表达式。
- `add!(init_expr, priority)`: 注册自定义优先级的异步初始化表达式。

## 历史

在系统编程中，全局静态变量的初始化顺序极易引发隐蔽缺陷。
C++ 中这一经典缺陷被称为“静态初始化顺序灾难”（Static Initialization Order Fiasco）。
由于编译器无法跨编译单元确定静态变量的初始化顺序，相互依赖的全局变量可能在未就绪时被读取，导致未定义行为或程序崩溃。

为了解决此问题，现代操作系统和编译器引入了构造函数段（如 Unix 的 `.init`/`.ctors` 和 Windows 的 `.CRT$XCU`），允许在 `main` 执行前运行注册函数。
然而，该底层的同步执行方式无法与现代异步运行时（如 Tokio）协作。

Rust 开发者 David Tolnay 编写的 `linkme` 利用链接段实现跨平台分布式切片，提供了安全高效的链接期收集方案。
xboot 在此基础上结合异步协程与优先级调度，使现代 Rust 应用程序能够按拓扑顺序确定性地在 `main` 启动前初始化数据库、服务等复杂异步资源，在保障安全性的同时维持极致运行效率。


## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

