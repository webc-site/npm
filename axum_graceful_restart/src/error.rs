use std::{
  env::VarError, io::Error as IoError, net::AddrParseError, num::ParseIntError,
  result::Result as StdResult,
};

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] IoError),

  #[error(transparent)]
  Var(#[from] VarError),

  #[error(transparent)]
  ParseInt(#[from] ParseIntError),

  #[error(transparent)]
  AddrParse(#[from] AddrParseError),
}

pub type Result<T, E = Error> = StdResult<T, E>;
