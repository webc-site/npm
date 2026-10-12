use std::{io, time::Duration};

use log::info;
use nix::unistd::setsid;
use tokio::{
  process::{Child, Command},
  signal::unix::{SignalKind, signal},
  time::sleep,
};

use crate::{Error, Result};

/// 重启时新旧进程交接延迟：10秒（用于向后兼容的等待超时）
const RESTART_HANDOVER_DELAY: Duration = Duration::from_millis(10000);

struct ChildGuard {
  child: Option<Child>,
}

impl Drop for ChildGuard {
  fn drop(&mut self) {
    if let Some(mut child) = self.child.take() {
      let _ = child.start_kill();
      tokio::spawn(async move {
        let _ = child.wait().await;
      });
    }
  }
}

fn spawn_child() -> Result<Child> {
  let mut cmd = Command::from(self_cmd::get()?);
  unsafe {
    cmd.pre_exec(|| {
      if let Err(e) = setsid() {
        return Err(io::Error::from_raw_os_error(e as i32));
      }
      Ok(())
    });
  }
  let child = cmd.spawn()?;
  Ok(child)
}

pub async fn handle_sighup() -> Result<()> {
  // 必须在 spawn_child 前注册信号监听，避免信号丢失或导致父进程崩溃退出
  let mut sigusr1 = signal(SignalKind::user_defined1())?;

  let child = spawn_child()?;
  let pid = child.id().unwrap_or(0);

  let mut guard = ChildGuard { child: Some(child) };

  tokio::select! {
    _ = sigusr1.recv() => {
      // 收到新子进程的 SIGUSR1 就绪通知，立即完成交接
      info!("[SIGHUP] received SIGUSR1 ready signal from child pid={pid}");
    }
    status = async {
      guard.child.as_mut().unwrap().wait().await
    } => {
      let status = status?;
      let _ = guard.child.take();
      return Err(Error::ChildExit(status));
    }
    _ = sleep(RESTART_HANDOVER_DELAY) => {
      // 超时，为兼容未调用 notify_ready() 的子进程，进行二次检查
      if let Some(status) = guard.child.as_mut().unwrap().try_wait()? {
        let _ = guard.child.take();
        return Err(Error::ChildExit(status));
      }
    }
  }

  sys_notify::mainid(pid);
  info!("[SIGHUP] sys_notify mainid={pid}");

  if let Some(mut child) = guard.child.take() {
    tokio::spawn(async move {
      let _ = child.wait().await;
    });
  }

  Ok(())
}
