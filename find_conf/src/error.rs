use std::{io, result};

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error("IO error: {0} / IO 错误: {0}")]
  Io(#[from] io::Error),
}

pub type Result<T> = result::Result<T, Error>;
