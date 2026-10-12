use std::{
  env,
  os::{
    fd::{AsRawFd, OwnedFd, RawFd},
    unix::net::UnixStream,
  },
  sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
  },
};

use tokio::{
  io::AsyncReadExt, net::UnixStream as TokioUnixStream, process::Command, sync::Notify,
  time::timeout,
};
use tracing::{error, info};

use super::helper::{get_current_exe, set_cloexec};
use crate::{Result, os::consts::HANDSHAKE_TIMEOUT};

pub(crate) const RESTART_TCP_FD_ENV: &str = "AXUM_RESTART_TCP_FD";
pub(crate) const RESTART_NOTIFY_FD_ENV: &str = "AXUM_RESTART_NOTIFY_FD";

// 重启失败时自动复位 is_restarting，允许重试
struct RestartGuard {
  is_restarting: Arc<AtomicBool>,
  active: bool,
}

impl RestartGuard {
  fn new(is_restarting: Arc<AtomicBool>) -> Self {
    Self {
      is_restarting,
      active: true,
    }
  }

  fn commit(&mut self) {
    self.active = false;
  }
}

impl Drop for RestartGuard {
  fn drop(&mut self) {
    if self.active {
      self.is_restarting.store(false, Ordering::SeqCst);
    }
  }
}

pub(crate) async fn trigger_restart(
  raw_tcp_fd: RawFd,
  shutdown: Arc<Notify>,
  is_restarting: Arc<AtomicBool>,
) -> Result<()> {
  // RestartGuard 会在 trigger_restart 失败或子进程启动失败时自动将 is_restarting 复位为 false，从而允许重试
  let guard = RestartGuard::new(is_restarting);

  // 1. 创建用于父子进程就绪状态握手的本地 Socket Pair
  let (read_sock, write_sock) = UnixStream::pair()?;
  read_sock.set_nonblocking(true)?;
  let mut read_tokio = TokioUnixStream::from_std(read_sock)?;
  let write_fd = OwnedFd::from(write_sock);

  // 设为 CLOEXEC，防止被当前进程拉起的外界其他无关子进程继承
  set_cloexec(write_fd.as_raw_fd(), true)?;

  // 2. 获取当前运行的二进制路径（支持 Linux /proc/self/exe 机制以应对二进制已被替换的场景）
  let exe = get_current_exe()?;

  // 3. 构建子进程启动命令
  let mut cmd = Command::new(exe);
  cmd.args(env::args_os().skip(1));

  let raw_tcp_fd_str = raw_tcp_fd.to_string();
  let write_fd_raw = write_fd.as_raw_fd();
  let write_fd_str = write_fd_raw.to_string();

  // 通过环境变量将文件描述符传递给子进程
  cmd.env(RESTART_TCP_FD_ENV, &raw_tcp_fd_str);
  cmd.env(RESTART_NOTIFY_FD_ENV, &write_fd_str);

  // 在 fork 之后、exec 之前，重置待继承 Fd 的 CLOEXEC 标志，使得新加载的程序能够使用它们
  unsafe {
    cmd.pre_exec(move || {
      set_cloexec(raw_tcp_fd, false)?;
      set_cloexec(write_fd_raw, false)?;
      Ok(())
    });
  }

  // 4. 启动新进程
  let mut child = cmd.spawn()?;

  // 父进程立即关闭自己持有的写端，使得当子进程退出或关闭其写端时，读端能立刻收到 EOF (不会因父进程自身持有写端而阻塞)
  drop(write_fd);

  // 5. 异步监控新进程的启动握手
  tokio::spawn(async move {
    // 移动 guard 以延长其生命周期到此异步块结束
    let mut guard = guard;
    let mut buf = [0u8; 1];

    // 等待子进程往 pipe 写入 '1'，表示其已完成监听初始化并准备接收外部请求
    match timeout(HANDSHAKE_TIMEOUT, read_tokio.read_exact(&mut buf)).await {
      Ok(Ok(_)) if buf[0] == b'1' => {
        info!("new process started successfully, triggering graceful shutdown for current process");
        shutdown.notify_one();

        // 重启成功，commit 守护，使得 is_restarting 保持 true，阻止后续重复触发重启
        guard.commit();
      }
      Ok(Ok(_)) => {
        error!(
          "new process handshake invalid (expected '1', got {:?})",
          buf[0]
        );
      }
      Ok(Err(err)) => {
        error!("failed to read handshake from new process: {err}");
      }
      Err(_) => {
        error!(
          "new process handshake timeout after {:?}",
          HANDSHAKE_TIMEOUT
        );
        let _ = child.kill().await;
      }
    }

    // 等待并处理子进程生命周期结束状态，防止产生僵尸进程
    match child.wait().await {
      Ok(status) => {
        if !status.success() {
          error!("child process exited with failure status: {status}");
        } else {
          info!("child process exited cleanly");
        }
      }
      Err(err) => {
        error!("failed to wait for child process: {err}");
      }
    }
  });

  Ok(())
}
