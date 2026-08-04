use std::{
  os::fd::RawFd,
  sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
  },
};

use tokio::{
  signal::unix::{SignalKind, signal},
  sync::Notify,
  time::sleep,
};
use tracing::{error, info};

use super::{helper::wait_for_shutdown, restart::trigger_restart};
use crate::{Result, os::consts::SHUTDOWN_TIMEOUT};

/// 异步监听 SIGHUP 信号。一旦收到信号，就 fork 并 exec 新进程。
pub(crate) async fn watch_sighup(
  raw_tcp_fd: RawFd,
  restart_signal: Arc<Notify>,
  is_restarting: Arc<AtomicBool>,
) -> Result<()> {
  let mut sighup = signal(SignalKind::hangup())?;
  while sighup.recv().await.is_some() {
    info!("SIGHUP received, triggering graceful restart");

    // 使用 CAS 确保并发时只有一个线程能发起重启
    if !is_restarting.swap(true, Ordering::SeqCst) {
      if let Err(err) =
        trigger_restart(raw_tcp_fd, restart_signal.clone(), is_restarting.clone()).await
      {
        error!("trigger_restart failed: {err}");
      }
    } else {
      info!("graceful restart already in progress, ignored SIGHUP");
    }
  }
  Ok(())
}

/// 等待关机信号（SIGINT/SIGTERM）或重启信号，以触发系统的优雅退出
pub(crate) async fn wait_shutdown_trigger(
  restart_signal: Arc<Notify>,
  shutdown_started: Arc<Notify>,
) {
  tokio::select! {
    _ = wait_for_shutdown() => {
      info!("Shutdown signal (SIGINT/SIGTERM) received");
    }
    _ = restart_signal.notified() => {
      info!("Graceful restart initiated, stopping listener");
    }
  }
  // 标记关机流程已启动
  shutdown_started.notify_one();
}

/// 优雅关机超时保护。一旦关机流程开启，如果 10 分钟内没有干净退出，则强制关机。
pub(crate) async fn watch_shutdown_timeout(shutdown_started: Arc<Notify>) {
  shutdown_started.notified().await;
  tokio::select! {
    _ = sleep(SHUTDOWN_TIMEOUT) => {
      info!("graceful shutdown timeout ({:?}) reached, forcing exit", SHUTDOWN_TIMEOUT);
    }
    _ = wait_for_shutdown() => {
      info!("force shutdown signal received during graceful shutdown");
    }
  }
}
