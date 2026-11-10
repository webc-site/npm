use std::result;

use fred::error::Error as FredError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  Kv(#[from] FredError),
}

pub type Result<T> = result::Result<T, Error>;
