# axum_graceful_restart

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
