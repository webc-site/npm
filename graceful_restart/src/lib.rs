#![cfg_attr(docsrs, feature(doc_cfg))]

pub(crate) mod error;
pub(crate) mod os;

use std::{
  env::consts::{ARCH, OS},
  process,
  sync::LazyLock,
  time::Duration,
};

pub use error::{Error, Result};
use futures::StreamExt;
use listen_signal::{SIGHUP, wait_all};
use log::{error, info, warn};
#[cfg(unix)]
use nix::sys::signal::{Signal, kill};
#[cfg(unix)]
use nix::unistd::getppid;
use tokio::{
  sync::RwLock,
  time::{sleep, timeout},
};
use tokio_util::sync::CancellationToken;

pub static LOCK: RwLock<()> = RwLock::const_new(());

pub static CANCEL: LazyLock<CancellationToken> = LazyLock::new(CancellationToken::new);

/// 优雅停机超时时间：10分钟
const SHUTDOWN_TIMEOUT: Duration = Duration::from_secs(600);

/// 通知父进程当前子进程已就绪
#[cfg(unix)]
pub fn notify_ready() {
  let ppid = getppid();
  if ppid.as_raw() > 1 {
    let _ = kill(ppid, Signal::SIGUSR1);
  }
}

/// 非 Unix 平台空实现
#[cfg(not(unix))]
pub fn notify_ready() {}

pub async fn graceful_restart() {
  let mut signals = wait_all();
  while let Some(signal) = signals.next().await {
    if signal == SIGHUP {
      match os::handle_sighup().await {
        Ok(()) => break,
        Err(Error::UnsupportedPlatform) => {
          warn!("SIGHUP is not supported on {OS}({ARCH}), ignoring restart request");
          continue;
        }
        Err(e) => {
          error!("SIGHUP restart failed, keeping process alive: {e}");
          // 增加 500ms 退避，避免在堆积信号下高频重试
          sleep(Duration::from_millis(500)).await;
          continue;
        }
      }
    }

    // 其它信号（SIGINT, SIGTERM 等），直接退出循环执行 shutdown
    break;
  }

  CANCEL.cancel();

  let mut shutdown_fut = std::pin::pin!(timeout(SHUTDOWN_TIMEOUT, LOCK.write()));

  loop {
    tokio::select! {
      res = &mut shutdown_fut => {
        if res.is_err() {
          warn!("graceful shutdown timeout (10m), forcing exit");
        }
        break;
      }
      sig = signals.next() => {
        match sig {
          Some(s) if s != SIGHUP => {
            warn!("forced shutdown signal received, exiting immediately");
            break;
          }
          Some(_) => {}
          None => break,
        }
      }
    }
  }

  info!("pid={} exit", process::id());
  log::logger().flush();
  process::exit(0);
}

xboot::add!(tokio::spawn(graceful_restart()));
