use std::result;

use reqwest::StatusCode;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error("HTTP Status Error: {0:?}")]
  Status(Box<reqwest::Response>),
  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),
}

impl Error {
  pub fn status_code(&self) -> Option<StatusCode> {
    match self {
      Self::Status(res) => Some(res.status()),
      Self::Reqwest(err) => err.status(),
    }
  }
}

pub type Result<T> = result::Result<T, Error>;
