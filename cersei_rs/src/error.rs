use std::{io, result};

use cersei::prelude::CerseiError;
use napi::Error as NapiError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  Cersei(#[from] CerseiError),
  #[error(transparent)]
  Io(#[from] io::Error),
}

pub type Result<T> = result::Result<T, Error>;

impl From<Error> for napi::Error {
  fn from(err: Error) -> Self {
    NapiError::from_reason(err.to_string())
  }
}
