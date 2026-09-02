#[cfg(target_os = "linux")]
use std::os::unix::ffi::OsStrExt;
use std::{
  env,
  io::{Error as IoError, Result as IoResult},
  mem::size_of_val,
  net::SocketAddr,
  os::fd::{AsRawFd, RawFd},
  path::PathBuf,
  process::id as process_id,
};

use tokio::{
  net::{TcpListener, TcpSocket},
  signal::unix::{SignalKind, signal},
};
use tracing::info;

use crate::Result;

pub(crate) fn listen(addr: SocketAddr) -> Result<TcpListener> {
  let socket = if addr.is_ipv4() {
    TcpSocket::new_v4()?
  } else {
    let s = TcpSocket::new_v6()?;
    unsafe {
      let optval: libc::c_int = 0;
      libc::setsockopt(
        s.as_raw_fd(),
        libc::IPPROTO_IPV6,
        libc::IPV6_V6ONLY,
        &optval as *const _ as *const libc::c_void,
        size_of_val(&optval) as libc::socklen_t,
      );
    }
    s
  };
  socket.set_reuseaddr(true)?;
  socket.bind(addr)?;
  Ok(socket.listen(128)?)
}

pub(crate) async fn wait_for_shutdown() -> Result<()> {
  let pid = process_id();
  let mut sigterm = signal(SignalKind::terminate())?;
  let mut sigint = signal(SignalKind::interrupt())?;
  tokio::select! {
    _ = sigterm.recv() => {
      info!("{pid} | SIGTERM recv");
    }
    _ = sigint.recv() => {
      info!("{pid} | SIGINT (Ctrl+C) recv");
    }
  }
  Ok(())
}

pub(crate) fn get_current_exe() -> Result<PathBuf> {
  let exe = env::current_exe()?;

  #[cfg(target_os = "linux")]
  let exe = {
    let mut exe = exe;
    if !exe.exists() {
      let path_bytes = exe.as_os_str().as_bytes();
      if let Some(cleaned) = path_bytes.strip_suffix(b" (deleted)") {
        let cleaned_path = PathBuf::from(std::ffi::OsStr::from_bytes(cleaned));
        if cleaned_path.exists() {
          exe = cleaned_path;
        } else {
          exe = PathBuf::from("/proc/self/exe");
        }
      }
    }
    exe
  };

  Ok(exe)
}

pub(crate) fn set_cloexec(fd: RawFd, set: bool) -> IoResult<()> {
  let flags = unsafe { libc::fcntl(fd, libc::F_GETFD) };
  if flags == -1 {
    return Err(IoError::last_os_error());
  }
  let new_flags = if set {
    flags | libc::FD_CLOEXEC
  } else {
    flags & !libc::FD_CLOEXEC
  };
  if unsafe { libc::fcntl(fd, libc::F_SETFD, new_flags) } == -1 {
    return Err(IoError::last_os_error());
  }
  Ok(())
}
