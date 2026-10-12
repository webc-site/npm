use std::{io, result};

use ciborium::{de, ser};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  Http(#[from] reqer::Error),

  #[error(transparent)]
  CborEncode(#[from] ser::Error<io::Error>),

  #[error(transparent)]
  CborDecode(#[from] de::Error<io::Error>),

  #[error(transparent)]
  Json(#[from] sonic_rs::Error),

  #[error("jwt decode failed")]
  JwtDecode,

  #[error("http status {0}: {1}")]
  Status(u16, String),

  #[error("rpc error: {0}")]
  Rpc(String),

  #[error("invalid record id: {0}")]
  RecordId(String),

  #[error("query error: {0}")]
  Query(String),
}

pub type Result<T> = result::Result<T, Error>;
