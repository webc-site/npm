use std::{io, result};

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error("failed to spawn walk thread: {0} / 启动遍历线程失败: {0}")]
  Spawn(io::Error),
}

pub type Result<T> = result::Result<T, Error>;
