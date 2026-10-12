[English](#en) | [中文](#zh)

---

<a id="en"></a>

# axum_graceful_restart

- [axum_graceful_restart](#axum_graceful_restart)
  - [<a name="english"></a>English](#a-nameenglishaenglish)
    - [<a name="introduction"></a>Introduction](#a-nameintroductionaintroduction)
    - [<a name="key-features"></a>Key Features](#a-namekey-featuresakey-features)
    - [<a name="usage"></a>Usage](#a-nameusageausage)
    - [<a name="design-philosophy"></a>Design Philosophy](#a-namedesign-philosophyadesign-philosophy)
    - [<a name="technology-stack"></a>Technology Stack](#a-nametechnology-stackatechnology-stack)
    - [<a name="file-structure"></a>File Structure](#a-namefile-structureafile-structure)
    - [<a name="a-little-history-the-story-of-so_reuseport"></a>A Little History: The Story of SO_REUSEPORT](#a-namea-little-history-the-story-of-so_reuseportaa-little-history-the-story-of-so_reuseport)
  - [About](#about)

[English](#english) | [中文](#中文)

---

## <a name="english"></a>English

- [Introduction](#introduction)
- [Key Features](#key-features)
- [Usage](#usage)
- [Design Philosophy](#design-philosophy)
- [Technology Stack](#technology-stack)
- [File Structure](#file-structure)
- [A Little History: The Story of SO_REUSEPORT](#a-little-history-the-story-of-so_reuseport)

### <a name="introduction"></a>Introduction

`axum_graceful_restart` is a utility library for the Axum web framework that enables graceful shutdowns and zero-downtime restarts. In modern web service deployment, it is crucial to update and restart services without interrupting live traffic. This library addresses that need by providing a simple `serve` function that enhances Axum's default server with critical features for high-availability systems.

### <a name="key-features"></a>Key Features

- **Graceful Shutdown**: Listens for `SIGTERM` and `SIGINT` (Ctrl+C) signals to allow the server to shut down gracefully, finishing in-flight requests, guarded by a configurable `SHUTDOWN_TIMEOUT` (default 10 minutes).
- **Zero-Downtime Restarts**: Utilizes the `SO_REUSEPORT` socket option (on supported platforms) and file descriptor inheritance during fork/exec, allowing multiple server instances to bind to the same port. This is the foundation for rolling restart strategies, where a new version of the service can start and take over traffic before the old one shuts down.
- **Robust IPC Handshake**: Establishes a local Unix socket pair between parent and child to coordinate ready states. Features granular diagnostics capturing exact handshake failures (such as premature termination or invalid response bytes).
- **Port Pre-cleaning**: Automatically kills any process occupying the target port before starting the server on unsupported platforms like Windows, streamlining deployment workflows.

### <a name="usage"></a>Usage

Here is a basic example of how to use `axum_graceful_restart`:

```rust
use std::time::Duration;

use axum::{Router, routing::get};
use axum_graceful_restart::{Result, serve};
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<()> {
  loginit::init();
  let app = Router::new().route("/", get(handler));

  serve("[::]:8899".parse()?, app).await
}

async fn handler() -> String {
  let pid = std::process::id();
  println!("new conn");
  sleep(Duration::from_secs(10)).await;
  format!("PID: {pid}")
}
```

To perform a zero-downtime restart, you can send a `SIGHUP` signal to the active process. It will spawn the new version of the application and transition traffic seamlessly.

### <a name="design-philosophy"></a>Design Philosophy

The core idea is to pass the listening socket file descriptor to the child process and coordinate shutdown states using IPC.

1.  **Socket Handover**: In UNIX environments, the active `TcpListener` file descriptor is inherited by the spawned child process with its `CLOEXEC` flag stripped off during `pre_exec`.
2.  **Ready Notification**: A Unix Socket Pair coordinates process startup. The child process writes `1` to the notify file descriptor once it binds successfully, which signals the parent to start shutting down.
3.  **Timeout-Protected Shutdown**: Once the graceful shutdown is initiated, the old process halts its listener loop. A 10-minute timer guards the process lifecycle, forcing exit if active connections fail to drain in time.

### <a name="technology-stack"></a>Technology Stack

- [Axum](https://github.com/tokio-rs/axum): The web application framework.
- [Tokio](https://tokio.rs/): The asynchronous runtime.
- [socket2](https://crates.io/crates/socket2): Used for creating sockets with advanced options like `SO_REUSEPORT`.
- [kill-port](https://crates.io/crates/kill-port): Used to clear the port before the server starts.
- [tracing](https://crates.io/crates/tracing): For logging and diagnostics.

### <a name="file-structure"></a>File Structure

- `src/lib.rs`: The main library file exporting `GracefulRestart` and `serve`.
- `src/os/consts.rs`: Defies timeout constants (`SHUTDOWN_TIMEOUT`, `HANDSHAKE_TIMEOUT`).
- `src/os/unix/restart.rs`: Manages child process spawning, environment FD passing, and Unix IPC handshake.
- `src/os/unix/signal.rs`: Handles `SIGHUP` listener and timeout controls.
- `src/os/unix/helper.rs`: Manages socket creation, nonblocking state, and deleted path normalization.

### <a name="a-little-history-the-story-of-so_reuseport"></a>A Little History: The Story of SO_REUSEPORT

The `SO_REUSEPORT` socket option is a relatively modern addition to the world of networking, though the problem it solves is as old as server development itself. Before `SO_REUSEPORT`, achieving zero-downtime updates was a complex dance. Developers relied on intricate proxy setups or complicated file descriptor passing mechanisms between processes.

`SO_REUSEPORT` was introduced in Linux kernel 3.9 (released in 2013) and has since been adopted by other BSD-derived systems like macOS and FreeBSD. It was a game-changer. It allows multiple sockets to bind to the exact same IP address and port combination, as long as all of them set this option. The kernel then takes on the responsibility of load-balancing incoming connections across the listening sockets. This simple-sounding feature unlocked a much cleaner and more reliable pattern for high-availability services, enabling the elegant rolling restart strategies we see in many modern systems, including this library. It's a great example of how kernel-level improvements can profoundly simplify application-level architecture.

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI

---

<a id="zh"></a>

# axum_graceful_restart

- [axum_graceful_restart](#axum_graceful_restart)
  - [<a name="中文"></a>中文](#a-name中文a中文)
    - [<a name="简介-1"></a>简介](#a-name简介-1a简介)
    - [<a name="核心功能-1"></a>核心功能](#a-name核心功能-1a核心功能)
    - [<a name="使用示例-1"></a>使用示例](#a-name使用示例-1a使用示例)
    - [<a name="设计思路-1"></a>设计思路](#a-name设计思路-1a设计思路)
    - [<a name="技术栈-1"></a>技术栈](#a-name技术栈-1a技术栈)
    - [<a name="文件结构-1"></a>文件结构](#a-name文件结构-1a文件结构)
    - [<a name="技术拾遗so_reuseport-的故事"></a>技术拾遗：SO_REUSEPORT 的故事](#a-name技术拾遗so_reuseport-的故事a技术拾遗so_reuseport-的故事)
  - [关于](#关于)

[English](#english) | [中文](#中文)

---

## <a name="中文"></a>中文

- [简介](#简介-1)
- [核心功能](#核心功能-1)
- [使用示例](#使用示例-1)
- [设计思路](#设计思路-1)
- [技术栈](#技术栈-1)
- [文件结构](#文件结构-1)
- [技术拾遗：SO_REUSEPORT 的故事](#技术拾遗so_reuseport-的故事)

### <a name="简介-1"></a>简介

`axum_graceful_restart` 是一个为 Axum web 框架设计的工具库，旨在实现服务的优雅停机与零停机重启。在现代 Web 服务部署中，如何在不中断实时流量的情况下更新和重启服务至关重要。该库通过提供一个简单的 `serve` 函数来解决这一需求，它在 Axum 默认服务器的基础上，为高可用性系统增加了关键特性。

### <a name="核心功能-1"></a>核心功能

- **优雅停机**: 监听 `SIGTERM` 和 `SIGINT` (Ctrl+C) 信号，使服务器能够平滑关闭并处理完所有进行中的请求，最长受 `SHUTDOWN_TIMEOUT`（默认10分钟）超时保护。
- **零停机重启**: 利用 `SO_REUSEPORT` 套接字选项（在支持的平台上）以及 fork/exec 时的文件描述符继承，允许多个服务实例绑定到同一端口。新版本的服务可以在旧版本关闭之前启动并无缝接管流量。
- **严密 IPC 握手**: 父子进程间通过本地 Unix 套接字对进行启动状态握手。子进程完全启动并开始监听时反馈 `1`，若子进程因任何故障提前退出或发送非法字节，父进程将精准捕获（如捕获 `early eof` 异常）并记录日志，避免无效切换。
- **端口预清理**: 在 Windows 等不支持多进程监听的平台上，启动服务器前会自动终止任何占用目标端口的进程，简化本地开发和部署。

### <a name="使用示例-1"></a>使用示例

以下是 `axum_graceful_restart` 的基本使用方法：

```rust
use std::time::Duration;

use axum::{Router, routing::get};
use axum_graceful_restart::{Result, serve};
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<()> {
  loginit::init();
  let app = Router::new().route("/", get(handler));

  serve("[::]:8899".parse()?, app).await
}

async fn handler() -> String {
  let pid = std::process::id();
  println!("new conn");
  sleep(Duration::from_secs(10)).await;
  format!("PID: {pid}")
}
```

执行优雅重启时，可以向当前活跃进程发送 `SIGHUP` 信号，它会自动拉起新版二进制并无缝交接流量。

### <a name="设计思路-1"></a>设计思路

核心思想是将套接字绑定与监听文件描述符在 fork 过程中直接继承，并通过 IPC 协调进程退出时机。

1.  **套接字继承**: 在 UNIX 环境下，当前 `TcpListener` 的文件描述符会在 fork 之后、exec 之前，重置 `CLOEXEC` 标志（利用 `pre_exec` 实现），使新加载的子程序可直接读写。
2.  **握手通知**: 子进程启动就绪后，往继承的通知 FD 写入字符 `1`；父进程读取到该值后立即触发 `shutdown.notify_one()` 并开始优雅停机。
3.  **超时护航**: 优雅停机一经触发，老进程不再监听新连接，但会持续处理存量请求。通过 `tokio::select!` 结合 10 分钟定时器，确保即使存量连接发生阻滞，也能在超时后通过 RAII 彻底 Drop 释放所有连接和 FD，安全退场。

### <a name="技术栈-1"></a>技术栈

- [Axum](https://github.com/tokio-rs/axum): Web 应用框架。
- [Tokio](https://tokio.rs/): 异步运行时。
- [socket2](https://crates.io/crates/socket2): 用于创建具有 `SO_REUSEPORT` 等高级选项的套接字。
- [kill-port](https://crates.io/crates/kill-port): 用于在服务器启动前清理端口。
- [tracing](https://crates.io/crates/tracing): 用于日志记录和诊断。

### <a name="文件结构-1"></a>文件结构

- `src/lib.rs`: 核心导出文件，提供 `GracefulRestart` 与 `serve`。
- `src/os/consts.rs`: 定义各种系统超时常量（优雅停机与就绪握手时长）。
- `src/os/unix/restart.rs`: 负责子进程的拉起、环境变量传参、FD 清理及握手监控。
- `src/os/unix/signal.rs`: 实现 `SIGHUP` 监听器与超时保护机制。
- `src/os/unix/helper.rs`: 实现套接字非阻塞设置、信号监视与 Linux 下被删除二进制路径的切除还原。

### <a name="技术拾遗so_reuseport-的故事"></a>技术拾遗：SO_REUSEPORT 的故事

`SO_REUSEPORT` 套接字选项在网络编程领域是一个相对现代的补充，但它解决的问题与服务器开发本身一样古老。在 `SO_REUSEPORT` 出现之前，实现零停机更新是一项复杂的任务。开发者们依赖于复杂的代理设置或进程间传递文件描述符的繁琐机制。

`SO_REUSEPORT` 于 2013 年在 Linux 内核 3.9 版本中被引入，并此后被其他 BSD 衍生系统（如 macOS 和 FreeBSD）所采用。它的出现改变了游戏规则。它允许多个套接字绑定到完全相同的 IP 地址和端口组合，只要所有套接字都设置了此选项即可。然后，内核会负责在这些监听套接字之间对传入的连接进行负载均衡。这个听起来简单的功能，为高可用性服务解锁了一种更清晰、更可靠的模式，使得我们能在许多现代系统中（包括本库）看到这种优雅的滚动重启策略。这是内核级改进如何深刻简化应用层架构的一个绝佳范例。

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
