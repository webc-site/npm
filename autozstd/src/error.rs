use std::{io::Error as IoError, result};

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error("data is empty")]
  Empty,

  #[error("invalid type byte: {0}")]
  InvalidType(u8),

  #[error(transparent)]
  Zstd(#[from] IoError),
}

pub type Result<T> = result::Result<T, Error>;
