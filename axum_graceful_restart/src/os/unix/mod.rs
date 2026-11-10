mod helper;
mod restart;
mod signal;

use std::{
  env,
  fs::File,
  io::{Error as IoError, ErrorKind, Write},
  net::{SocketAddr, TcpListener as StdTcpListener},
  os::fd::{AsRawFd, FromRawFd, OwnedFd, RawFd},
  process::id as process_id,
  sync::{Arc, atomic::AtomicBool},
};

use axum::Router;
use helper::{listen, set_cloexec};
use restart::{RESTART_NOTIFY_FD_ENV, RESTART_TCP_FD_ENV};
use tokio::{net::TcpListener, sync::Notify};
use tracing::{error, info};

use crate::{Error, Result};

unsafe fn parse_inherited_fd(fd_str: &str) -> Result<OwnedFd> {
  let fd = fd_str.parse::<RawFd>()?;
  if fd <= 2 {
    return Err(Error::Io(IoError::new(
      ErrorKind::InvalidInput,
      "invalid fd value",
    )));
  }
  set_cloexec(fd, true)?;
  Ok(unsafe { OwnedFd::from_raw_fd(fd) })
}

struct NotifyGuard(Option<File>);

impl NotifyGuard {
  fn notify(&mut self) -> Result<()> {
    if let Some(mut f) = self.0.take() {
      f.write_all(b"1")?;
      f.flush()?;
    }
    Ok(())
  }
}

pub struct GracefulRestart {
  listener: TcpListener,
  notifier: NotifyGuard,
}

impl GracefulRestart {
  pub fn new(addr: SocketAddr) -> Result<Self> {
    let tcp_env = env::var(RESTART_TCP_FD_ENV);
    let notify_env = env::var(RESTART_NOTIFY_FD_ENV);

    // 立即移除，防止子进程意外继承
    unsafe {
      env::remove_var(RESTART_TCP_FD_ENV);
      env::remove_var(RESTART_NOTIFY_FD_ENV);
    }

    let listener = match tcp_env {
      Ok(fd_str) => {
        let owned_fd = unsafe { parse_inherited_fd(&fd_str)? };
        let std_listener = StdTcpListener::from(owned_fd);
        std_listener.set_nonblocking(true)?;
        TcpListener::from_std(std_listener)?
      }
      Err(_) => listen(addr)?,
    };

    let notify_file = notify_env
      .ok()
      .map(|fd_str| unsafe { parse_inherited_fd(&fd_str) }.map(File::from))
      .transpose()?;

    Ok(Self {
      listener,
      notifier: NotifyGuard(notify_file),
    })
  }

  pub async fn serve(mut self, app: Router) -> Result<()> {
    let raw_tcp_fd = self.listener.as_raw_fd();

    // 用于通知主服务开始优雅关机
    let restart_signal = Arc::new(Notify::new());
    // 用于标记是否已经在尝试重启，防止重复触发
    let is_restarting = Arc::new(AtomicBool::new(false));
    // 用于通知超时监控逻辑：优雅关机动作已正式开始
    let shutdown_started = Arc::new(Notify::new());

    // 1. 启动 SIGHUP 信号监听后台协程
    let sighup_task = tokio::spawn({
      let restart_signal = restart_signal.clone();
      let is_restarting = is_restarting.clone();
      async move {
        if let Err(err) = signal::watch_sighup(raw_tcp_fd, restart_signal, is_restarting).await {
          error!("SIGHUP watch task failed: {err}");
        }
      }
    });

    // 2. 构造传给 axum 的 graceful shutdown future
    let shutdown = signal::wait_shutdown_trigger(restart_signal, shutdown_started.clone());

    let pid = process_id();
    if let Ok(local_addr) = self.listener.local_addr() {
      info!("{pid} | listen {local_addr}");
    } else {
      info!("{pid} | listen");
    }

    // 3. 通知父进程（若存在）：本进程已就绪，可接管流量
    self.notifier.notify()?;

    // 4. 启动 Axum 服务
    let serve_fut =
      axum::serve(self.listener, app.into_make_service()).with_graceful_shutdown(shutdown);

    // 5. 构造优雅关机超时机制（最长10分钟限制）
    let shutdown_timeout = signal::watch_shutdown_timeout(shutdown_started);

    // 6. 并发运行服务与超时监控
    tokio::select! {
      res = serve_fut => {
        res?;
      }
      _ = shutdown_timeout => {}
    }

    // 退出前终止 SIGHUP 监听，防止 fd 复用导致向错的子进程传递 fd
    sighup_task.abort();
    info!("{pid} | shutdown");
    Ok(())
  }
}

pub async fn serve(addr: SocketAddr, app: Router) -> Result<()> {
  GracefulRestart::new(addr)?.serve(app).await
}
