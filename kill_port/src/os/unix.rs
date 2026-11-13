use std::io;

use nix::{
  sys::signal::{Signal, kill},
  unistd::Pid,
};

pub(crate) fn kill_process(pid: u32, retry: u32) -> io::Result<()> {
  let signal = if retry > 10 {
    Signal::SIGKILL
  } else {
    Signal::SIGTERM
  };
  kill(Pid::from_raw(pid as i32), signal)
    .map_err(|err| io::Error::other(format!("kill process {pid} with {signal:?}: {err}")))
}
