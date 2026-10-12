use std::{io, process::ExitStatus, result::Result as StdResult};

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] io::Error),

  #[cfg(unix)]
  #[error(transparent)]
  SelfCmd(#[from] self_cmd::Error),

  #[cfg(unix)]
  #[error(transparent)]
  Nix(#[from] nix::Error),

  #[cfg(unix)]
  #[error("child process exited prematurely with status: {0}")]
  ChildExit(ExitStatus),

  #[error("Unsupported platform")]
  UnsupportedPlatform,
}

pub type Result<T, E = Error> = StdResult<T, E>;
